import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import WorkflowTrigger from "./components/WorkflowTrigger.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <WorkflowTrigger />
    </ErrorBoundary>
  </StrictMode>,
);
