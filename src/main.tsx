import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import WorkflowTrigger from "./components/WorkflowTrigger";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Elemento #root não encontrado");

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <WorkflowTrigger />
    </ErrorBoundary>
  </StrictMode>,
);
