import { useState, useEffect } from "react";
import "./History.css";
import DownloadIcon from "../assets/download.svg?react";
import TrashIcon from "../assets/trash.svg?react";

export default function History() {
  const [loadingIds, setLoadingIds] = useState(new Set());
  const [historico, setHistorico] = useState([]);

  useEffect(() => {
    // carrega na montagem
    const carregar = () => {
      const lista = JSON.parse(localStorage.getItem("downloads") || "[]");
      setHistorico(lista);
    };

    carregar();

    // escuta mudanças
    window.addEventListener("storage", carregar);

    // cleanup — remove o listener quando o componente desmonta
    return () => window.removeEventListener("storage", carregar);
  }, []);

  function limparHistorico() {
    localStorage.removeItem("downloads");
    setHistorico([]);
  }

  async function handleDownload(event, item, index) {
    event.preventDefault();
    setLoadingIds((prev) => new Set([...prev, index]));
    const url = await runDownload(item.runId);
    setLoadingIds((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    const a = document.createElement("a");
    a.href = url;
    a.download = item.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function runDownload(runId) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/artifact/${runId}`,
        {
          method: "GET",
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Erro ${response.status}`);
      }

      const data = await response.json();

      return data.url;
    } catch (err) {
      console.log(err);
      return `Erro ao buscar link do arquivo: ${err.message}`;
    }
  }

  return (
    <>
      {historico.length === 0 ? null : (
        <div className="container history">
          <div className="title-card">
            <h2 className="title">Histórico de downloads</h2>
            <a className="btn-title" onClick={limparHistorico}>
              <TrashIcon className="btn" alt="Limpar histórico" />
            </a>
          </div>

          {historico.map((item, index) => (
            <div key={item.runId} className="card-history">
              <div className="card-info">
                <span className="data">
                  {new Date(item.date).toLocaleString("pt-BR")}
                </span>
                <a
                  className={`nome ${loadingIds.has(index) ? "disabled" : ""}`}
                  onClick={(e) => handleDownload(e, item, index)}
                >
                  {item.filename}
                </a>
              </div>
              <a
                className={`icone-download ${loadingIds.has(index) ? "disabled" : ""}`}
                onClick={(e) => handleDownload(e, item, index)}
              >
                {loadingIds.has(index) ? (
                  <div className="spinner" />
                ) : (
                  <DownloadIcon className="btn-down" alt="Download" />
                )}
              </a>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
