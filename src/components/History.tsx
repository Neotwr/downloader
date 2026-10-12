import { useState, useEffect } from "react";
import type { MouseEvent } from "react";
import type { DownloadHistoryItem, RunId } from "../types/workflow";
import { API_URL } from "../config/env";
import { readDownloadHistory } from "../utils/history";
import { errorMessage, parseArtifactResponse, readHttpError } from "../utils/validation";
import "./History.css";
import DownloadIcon from "../assets/download.svg?react";
import TrashIcon from "../assets/trash.svg?react";

export default function History() {
  const [loadingIds, setLoadingIds] = useState<Set<number>>(() => new Set());
  const [historico, setHistorico] = useState<DownloadHistoryItem[]>([]);

  useEffect(() => {
    // carrega na montagem
    const carregar = () => {
      setHistorico(readDownloadHistory());
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

  async function handleDownload(
    event: MouseEvent<HTMLAnchorElement>,
    item: DownloadHistoryItem,
    index: number,
  ): Promise<void> {
    event.preventDefault();
    setLoadingIds((prev) => new Set([...prev, index]));

    try {
      // Solicita um link novo (a URL pré-assinada expira) e repassa ao cliente
      const url = await runDownload(item.runId);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert(`Erro ao buscar link do arquivo: ${errorMessage(err, "Erro desconhecido.")}`);
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  }

  async function runDownload(runId: RunId): Promise<string> {
    const response = await fetch(
      `${API_URL}/artifact/${runId}`,
      {
        method: "GET",
      },
    );

    if (!response.ok) {
      throw new Error(await readHttpError(response));
    }

    const data: unknown = await response.json();
    return parseArtifactResponse(data).url;
  }

  return (
    <>
      {historico.length === 0 ? null : (
        <div className="container history">
          <div className="title-card">
            <h2 className="title">Histórico de downloads</h2>
            <a className="btn-title" onClick={limparHistorico} aria-label="Limpar histórico">
              <TrashIcon className="btn" aria-hidden="true" />
            </a>
          </div>

          {historico.map((item, index) => (
            <div key={item.runId} className="card-history">
              <div className="card-info">
                <span className="data">
                  {new Date(item.date).toLocaleString("pt-BR")}
                </span>
                <a
                  className={`nome${loadingIds.has(index) ? " disabled" : ""}`}
                  onClick={(e) => handleDownload(e, item, index)}
                >
                  {item.filename}
                </a>
              </div>
              <a
                aria-label="Download"
                className={`icone-download ${loadingIds.has(index) ? "disabled" : ""}`}
                onClick={(e) => handleDownload(e, item, index)}
              >
                {loadingIds.has(index) ? (
                  <div className="spinner" />
                ) : (
                  <DownloadIcon className="btn-down" aria-hidden="true" />
                )}
              </a>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
