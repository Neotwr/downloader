import { useState } from "react";
import "./FormUrl.css";
import WorkflowActions from "./WorkflowActions";
import { useWorkflow } from "../hooks/useWorkflow";

const EXTENSAO_OPTIONS = [
  "msixbundle",
  "msix",
  "appx",
  "appxbundle",
  "exe",
  "msi",
  "zip",
  "rar",
  "7z",
];

export default function FormUrl({ workflowId }) {
  const [hasValue, setValue] = useState(false);
  const [form, setForm] = useState({
    app_name: "",
    app_link: "",
    extensao: "",
  });

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

  function handleChange(e) {
    const updatedForm = { ...form, [e.target.name]: e.target.value };
    setForm(updatedForm);
    setValue(updatedForm.app_link.trim() !== "" && updatedForm.extensao !== "");
  }

  function validate() {
    if (!form.app_link.trim()) return "Informe o link de download.";
    try {
      new URL(form.app_link.trim());
    } catch {
      return "O link informado não é uma URL válida.";
    }
    if (!form.extensao) return "Selecione a extensão do arquivo.";
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
        app_name: form.app_name.trim() || "app",
        app_link: form.app_link.trim(),
        extensao: form.extensao,
      },
    });
  }

  function handleReset() {
    resetWorkflow();
  }

  const appLabel = form.app_name.trim();
  const previewFilename = form.extensao
    ? `${appLabel}.${form.extensao}`
    : form.app_name.trim();

  return (
    <>
      <div className="wt-card">
        <div className="wt-field">
          <label className="wt-label" htmlFor="app_link">
            Link de download <span className="wt-required">*</span>
          </label>
          <input
            id="app_link"
            name="app_link"
            className="wt-input"
            type="text"
            placeholder="https://exemplo.com/arquivo.exe"
            value={form.app_link}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <div className="wt-row">
          <div className="wt-field">
            <label className="wt-label" htmlFor="extensao">
              Extensão <span className="wt-required">*</span>
            </label>
            <select
              id="extensao"
              name="extensao"
              className="wt-select"
              value={form.extensao}
              onChange={handleChange}
              disabled={isLoading}
            >
              <option value="">Selecionar</option>
              {EXTENSAO_OPTIONS.map((ext) => (
                <option key={ext} value={ext}>
                  .{ext}
                </option>
              ))}
            </select>
          </div>

          <div className="wt-field">
            <label className="wt-label" htmlFor="app_name">
              Nome do arquivo{" "}
              <span className="wt-label-optional">— opcional</span>
            </label>
            <input
              id="app_name"
              name="app_name"
              className="wt-input"
              type="text"
              placeholder='ex: "PowerToys"'
              value={form.app_name}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
        </div>

        {previewFilename && (
          <div className="wt-preview">
            <span className="wt-preview-icon">📄</span>
            <span className="wt-preview-name">{previewFilename}</span>
          </div>
        )}
      </div>

      <WorkflowActions
        status={status}
        statusMsg={statusMsg}
        result={result}
        error={error}
        isLoading={isLoading}
        handleReset={handleReset}
        handleRun={handleRun}
        hasValue={hasValue}
      />
    </>
  );
}
