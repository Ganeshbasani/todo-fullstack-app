import React from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AnimatePresence } from "framer-motion";
import TodoItem from "./TodoItem";

function TodoList({
  todos,
  selectedIds,
  onSelect,
  onToggle,
  onSaveEdit,
  onRequestDelete,
  onDragEnd,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={todos.map((todo) => todo.id)} strategy={verticalListSortingStrategy}>
        <ul className="todo-list">
          <AnimatePresence>
            {todos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                isSelected={selectedIds.includes(todo.id)}
                onSelect={onSelect}
                onToggle={onToggle}
                onSaveEdit={onSaveEdit}
                onRequestDelete={onRequestDelete}
              />
            ))}
          </AnimatePresence>
        </ul>
      </SortableContext>
    </DndContext>
  );
}

export default TodoList;

