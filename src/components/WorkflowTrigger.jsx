import { useState } from "react";
import FormUrl from "./FormUrl.jsx";
import FormPython from "./FormPython.jsx";
import History from "./History.jsx";
import "./WorkflowTrigger.css";

const F_URL = import.meta.env.VITE_WORKFLOW_URL;
const F_PYTHON = import.meta.env.VITE_WORKFLOW_PYTHON;

export default function WorkflowTrigger() {
  const [mode, setMode] = useState("url");

  return (
    <div className="wt-wrap">
      <div className="container">
        <div className="buttons">
          <button
            className={`btn-url ${mode === "url" ? "active" : ""}`}
            onClick={() => setMode("url")}
          >
            Download URL
          </button>
          <button
            className={`btn-python ${mode === "python" ? "active" : ""}`}
            onClick={() => setMode("python")}
          >
            Download Python
          </button>
        </div>
        <div className="wt-header">
          <h1 className="wt-title">
            Download via <span className="wt-title-accent">Actions</span>
          </h1>
          <p className="wt-subtitle">
            Dispare o workflow e receba o link de download
          </p>
        </div>
        {mode === "url" ? (
          <FormUrl workflowId={F_URL} />
        ) : (
          <FormPython workflowId={F_PYTHON} />
        )}
      </div>

      <History />
    </div>
  );
}
