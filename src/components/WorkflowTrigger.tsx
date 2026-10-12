import { useState } from "react";
import { WORKFLOW_URL, WORKFLOW_PYTHON } from "../config/env";
import FormUrl from "./FormUrl";
import FormPython from "./FormPython";
import History from "./History";
import "./WorkflowTrigger.css";

type Mode = "url" | "python";

export default function WorkflowTrigger() {
  const [mode, setMode] = useState<Mode>("url");

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
            <span className="wt-title-accent">Download</span>
          </h1>
          <p className="wt-subtitle">
            Insira o link direto de download ou o pacote Python para gerar o arquivo desejado.
          </p>
        </div>
        {mode === "url" ? (
          <FormUrl workflowId={WORKFLOW_URL} />
        ) : (
          <FormPython workflowId={WORKFLOW_PYTHON} />
        )}
      </div>

      <History />
    </div>
  );
}
