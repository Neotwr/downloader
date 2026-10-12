import { useState } from "react";
import type { ChangeEvent } from "react";
import "./FormPython.css";
import WorkflowActions from "./WorkflowActions";
import { useWorkflow } from "../hooks/useWorkflow";

interface FormPythonProps {
  workflowId: "PyDownload";
}

export default function FormPython({ workflowId }: FormPythonProps) {
  const [form, setForm] = useState({ package: "" });

  const {
    status,
    statusMsg,
    result,
    error,
    isLoading,
    executeWorkflow,
    resetWorkflow,
    setWorkflowError,
  } = useWorkflow();

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setForm({ package: e.currentTarget.value });
  }

  function validate(): string | null {
    if (!form.package.trim()) return "Informe o nome da biblioteca.";
    return null;
  }

  async function handleRun() {
    const validationResult = validate();
    if (validationResult) {
      setWorkflowError(validationResult);
      return;
    }

    await executeWorkflow({
      id: workflowId,
      inputs: {
        package: form.package.trim(),
      },
    });
  }

  function handleReset() {
    resetWorkflow();
  }

  const showTip = form.package ? true : false;

  return (
    <>
      <div className="wt-card">
        <div className="wt-field">
          <label className="wt-label" htmlFor="package">
            Nome da biblioteca Python <span className="wt-required">*</span>
            {showTip && (
              <span className="wt-label-optional">
                {" "}
                — para mais de uma biblioteca use espaço
              </span>
            )}
          </label>
          <input
            id="package"
            name="package"
            className="wt-input"
            type="text"
            placeholder="pandas selenium numpy..."
            value={form.package}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>
      </div>

      <WorkflowActions
        status={status}
        statusMsg={statusMsg}
        result={result}
        error={error}
        isLoading={isLoading}
        handleReset={handleReset}
        handleRun={handleRun}
        hasValue={form.package.trim() !== ""}
      />
    </>
  );
}
