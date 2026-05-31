import { useState } from "react";
import { STATUS } from "../hooks/useWorkflow";
import "./WorkflowActions.css";

export default function WorkflowActions({
  status,
  statusMsg,
  result,
  error,
  isLoading,
  handleReset,
  handleRun,
  hasValue,
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (!result?.url) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(result.url);
      } else {
        // Fallback para navegadores antigos
        const textarea = document.createElement("textarea");
        textarea.value = result.url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.error("Falha ao copiar:", err);
      // Mostrar mensagem de erro ou fallback
      alert("Não foi possível copiar. Link: " + result.url);
    }
  }

  return (
    <>
      <button
        className="wt-btn-run"
        onClick={handleRun}
        disabled={isLoading ? true : !hasValue}
      >
        {isLoading ? (
          <>
            <span className="wt-spinner" />
            Executando...
          </>
        ) : (
          <>
            Executar workflow
            <i className="wt-btn-arrow">→</i>
          </>
        )}
      </button>

      {isLoading && (
        <div className="wt-status-loading">
          <div className="wt-loader" />
          <span className="wt-status-msg">{statusMsg}</span>
          {status === STATUS.RUNNING && (
            <span className="wt-badge wt-badge-running">em execução</span>
          )}
        </div>
      )}

      {status === STATUS.DONE && result && (
        <div className="wt-result-card">
          <div className="wt-result-header">
            <span className="wt-result-label">Link de download</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="wt-badge wt-badge-done">concluído</span>
              <button className="wt-reset-btn" onClick={handleReset}>
                Novo download
              </button>
            </div>
          </div>
          <div className="wt-result-link">
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="wt-result-url"
            >
              {result.filename}
            </a>
            <button className="wt-copy-btn" onClick={copyLink}>
              {copied ? "Copiado" : "Copiar link"}
            </button>
          </div>
          {result.filename && (
            <p className="wt-result-meta">disponível por 2 dias</p>
          )}
        </div>
      )}

      {error && (
        <div className="wt-error-card">
          <span>{error}</span>
          <button className="wt-error-dismiss" onClick={handleReset}>
            ✕
          </button>
        </div>
      )}
    </>
  );
}
