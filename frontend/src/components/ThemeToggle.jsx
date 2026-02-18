import React from "react";
import { Moon, Sun } from "lucide-react";

function ThemeToggle({ theme, onToggle }) {
  return (
    <button className="btn btn-ghost theme-toggle" onClick={onToggle}>
      {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}

export default ThemeToggle;

