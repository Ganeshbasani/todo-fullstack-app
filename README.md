# Todo Fullstack App

## Agenda of the App (Purpose)

### 1. Functional Agenda (User side)

This app exists to help users manage daily tasks efficiently through a simple and clear workflow:
- Create new tasks (todos)
- View all tasks
- Update or edit tasks
- Mark tasks as completed/incomplete
- Delete tasks

In short, it is a lightweight task management system.

### 2. Technical Agenda (Engineering side)

This project is also a full-stack skills demonstration, not just a basic todo app.
It demonstrates:
- Backend API design using FastAPI
- Database integration with MongoDB
- RESTful architecture
- Frontend UI development with React
- Frontend and backend communication via HTTP APIs
- Clean project structure and separation of concerns

Project structure:

```text
todo-fullstack-app/
├── backend/
│   ├── src/
│   ├── .env
│   ├── requirements.txt
│   ├── server.py
│   ├── pom.xml
│   └── README.md
├── frontend/
│   ├── src/
│   ├── public/
│   ├── .env
│   ├── package.json
│   └── README.md
└── README.md
```

## Run locally

1. Backend:
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```
2. Frontend:
```bash
cd frontend
yarn install
yarn start
```

<img width="1778" height="953" alt="image" src="https://github.com/user-attachments/assets/0af99805-b1db-4ac1-80ed-671dd95ed672" />

