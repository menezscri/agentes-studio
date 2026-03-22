import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import AgentStudio from "./AgentStudio.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AgentStudio />
  </StrictMode>
);
