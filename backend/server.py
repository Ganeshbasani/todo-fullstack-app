from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from pymongo.errors import PyMongoError


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# This is MongoDB connection
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(
    mongo_url,
    serverSelectionTimeoutMS=2000,
    connectTimeoutMS=2000,
    socketTimeoutMS=2000,
)
db = client[os.environ["DB_NAME"]]


app = FastAPI()

# Creating a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define the Todo Models
class TodoBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Title is mandatory")
    description: Optional[str] = Field(None, max_length=1000)
    completed: bool = Field(default=False)

    @field_validator("title")
    @classmethod
    def title_must_not_be_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()


class TodoCreate(TodoBase):
    pass


class TodoUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    completed: Optional[bool] = None

    @field_validator("title")
    @classmethod
    def title_must_not_be_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and (not v or not v.strip()):
            raise ValueError("Title cannot be empty")
        return v.strip() if v else None


class Todo(TodoBase):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# API Routes
@api_router.get("/")
async def root():
    return {"message": "Todo API - FastAPI Backend"}


@api_router.post("/todos", response_model=Todo, status_code=201)
async def create_todo(todo_input: TodoCreate):
    """Create a new todo."""
    todo_dict = todo_input.model_dump()
    todo_obj = Todo(**todo_dict)

    
    doc = todo_obj.model_dump()
    doc["createdAt"] = doc["createdAt"].isoformat()

    try:
        await db.todos.insert_one(doc)
    except PyMongoError:
        logger.warning("MongoDB unavailable during create; using in-memory fallback")
        memory_todos[todo_obj.id] = todo_obj.model_dump()
    return todo_obj


@api_router.get("/todos", response_model=List[Todo])
async def get_todos(completed: Optional[bool] = None):
    """
    Get all todos with optional filter by completed status.
    Query param: completed (true/false)
    """
    query = {}
    if completed is not None:
        query["completed"] = completed

    try:
        
        todos = await db.todos.find(query, {"_id": 0}).to_list(1000)
    except PyMongoError:
        logger.warning("MongoDB unavailable during list; using in-memory fallback")
        todos = list(memory_todos.values())
        if completed is not None:
            todos = [todo for todo in todos if todo.get("completed") == completed]

  
    for todo in todos:
        if isinstance(todo["createdAt"], str):
            todo["createdAt"] = datetime.fromisoformat(todo["createdAt"])

    todos.sort(key=lambda x: x["createdAt"], reverse=True)

    return todos


@api_router.get("/todos/{todo_id}", response_model=Todo)
async def get_todo(todo_id: str):
    """Get a single todo by ID."""
    try:
        todo = await db.todos.find_one({"id": todo_id}, {"_id": 0})
    except PyMongoError:
        logger.warning("MongoDB unavailable during get; using in-memory fallback")
        todo = memory_todos.get(todo_id)

    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    #
    if isinstance(todo["createdAt"], str):
        todo["createdAt"] = datetime.fromisoformat(todo["createdAt"])

    return todo


@api_router.put("/todos/{todo_id}", response_model=Todo)
async def update_todo(todo_id: str, todo_update: TodoUpdate):
    """Update a todo (title, description, or completed status)."""
    use_memory_fallback = False

  
    try:
        existing_todo = await db.todos.find_one({"id": todo_id}, {"_id": 0})
    except PyMongoError:
        logger.warning("MongoDB unavailable during update; using in-memory fallback")
        use_memory_fallback = True
        existing_todo = memory_todos.get(todo_id)

    if not existing_todo:
        raise HTTPException(status_code=404, detail="Todo not found")

  
    update_data = todo_update.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    if use_memory_fallback:
        updated_todo = {**existing_todo, **update_data}
        memory_todos[todo_id] = updated_todo
    else:
        
        try:
            await db.todos.update_one(
                {"id": todo_id},
                {"$set": update_data},
            )
        except PyMongoError:
            logger.warning("MongoDB unavailable during update write; using in-memory fallback")
            updated_todo = {**existing_todo, **update_data}
            memory_todos[todo_id] = updated_todo
        else:
            # Fetch and return
            try:
                updated_todo = await db.todos.find_one({"id": todo_id}, {"_id": 0})
            except PyMongoError:
                logger.warning("MongoDB unavailable during update readback; using in-memory fallback")
                updated_todo = {**existing_todo, **update_data}
                memory_todos[todo_id] = updated_todo

    
    if isinstance(updated_todo["createdAt"], str):
        updated_todo["createdAt"] = datetime.fromisoformat(updated_todo["createdAt"])

    return updated_todo


@api_router.delete("/todos/{todo_id}", status_code=204)
async def delete_todo(todo_id: str):
    """Delete a todo."""
    try:
        result = await db.todos.delete_one({"id": todo_id})
    except PyMongoError:
        logger.warning("MongoDB unavailable during delete; using in-memory fallback")
        removed = memory_todos.pop(todo_id, None)
        if removed is None:
            raise HTTPException(status_code=404, detail="Todo not found")
        return None

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Todo not found")

    return None


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


memory_todos = {}


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
