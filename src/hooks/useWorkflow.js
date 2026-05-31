import { useState, useEffect, useRef } from "react";

export const STATUS = {
  IDLE: "idle",
  DISPATCHING: "dispatching",
  RUNNING: "running",
  DONE: "done",
  ERROR: "error",
};

const MAX_HISTORY_SIZE = 50; // Manter últimos 50 downloads

const wsUrl = import.meta.env.VITE_API_URL?.replace(
  "https://",
  "wss://",
)?.replace("http://", "ws://");
if (!wsUrl) throw new Error("VITE_API_URL inválido");

export function useWorkflow() {
  // 1. O Hook guarda toda a "memória" da requisição
  const [status, setStatus] = useState(STATUS.IDLE);
  const [statusMsg, setStatusMsg] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const wsRef = useRef(null);
  const timeoutRef = useRef(null);

  // 2. Limpeza: se o usuário mudar de aba, fechamos o WebSocket
  useEffect(() => {
    return () => wsRef.current?.close();
  }, []);

  const validateEnvVars = () => {
    const required = ["VITE_API_URL"];
    const missing = required.filter((v) => !import.meta.env[v]);

    if (missing.length > 0) {
      throw new Error(
        `❌ Variáveis de ambiente faltando: ${missing.join(", ")}`,
      );
    }
  };

  if (typeof window !== "undefined") {
    validateEnvVars();
  }

  function connectWebSocket(runId) {
    const ws = new WebSocket(`${wsUrl}/runs/${runId}`);
    wsRef.current = ws;

    timeoutRef.current = setTimeout(() => {
      setWorkflowError("Sem resposta do servidor.");
      ws.close();
    }, 300000);

    ws.onmessage = (event) => {
      clearTimeout(timeoutRef.current);

      const data = JSON.parse(event.data);
      if (data.type === "status") setStatusMsg(data.message);
      if (data.type === "done") {
        const result = { url: data.downloadUrl, filename: data.filename };
        setResult(result);
        setStatus(STATUS.DONE);
        saveDownloadToHistory(result, runId); // salvando historico de download no localStorage

        ws.close();
      }
      if (data.type === "error") {
        setWorkflowError(data.message || "O workflow falhou.");
        ws.close();
      }
    };

    ws.onerror = () => {
      clearTimeout(timeoutRef.current);
      setWorkflowError("Erro na conexão com o servidor.");
    };
  }

  // 3. A Função principal: Repare que ela recebe um 'payload' genérico
  async function executeWorkflow(payload) {
    setError("");
    setResult(null);
    setStatus(STATUS.DISPATCHING);
    setStatusMsg("Disparando workflow...");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/trigger`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload), // Aqui está o segredo da reutilização!
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Erro ${response.status}`);
      }

      const { runId } = await response.json();
      setStatus(STATUS.RUNNING);
      setStatusMsg("Aguardando o GitHub Actions...");
      connectWebSocket(runId);
    } catch (err) {
      setWorkflowError(err.message || "Erro ao disparar o workflow.");
    }
  }

  function setWorkflowError(message) {
    setError(message);
    setStatus(STATUS.ERROR);
  }

  function resetWorkflow() {
    setStatus(STATUS.IDLE);
    setResult(null);
    setError("");
    setStatusMsg("");
    wsRef.current?.close();
    clearTimeout(timeoutRef.current);
  }

  const isLoading = status === STATUS.DISPATCHING || status === STATUS.RUNNING;

  function saveDownloadToHistory(result, runId) {
    const novoItem = {
      ...result,
      runId: runId,
      date: new Date().toISOString(),
    };

    let listaAtual = JSON.parse(localStorage.getItem("downloads") || "[]");
    listaAtual = [novoItem, ...listaAtual]; // Novos no início

    // Manter apenas últimos MAX_HISTORY_SIZE
    if (listaAtual.length > MAX_HISTORY_SIZE) {
      listaAtual = listaAtual.slice(0, MAX_HISTORY_SIZE);
    }

    localStorage.setItem("downloads", JSON.stringify(listaAtual));
    window.dispatchEvent(new Event("storage"));
  }

  // 4. O Hook "exporta" apenas o que o componente visual precisa para funcionar
  return {
    status,
    statusMsg,
    result,
    error,
    isLoading,
    executeWorkflow,
    resetWorkflow,
    setWorkflowError,
    saveDownloadToHistory,
  };
}
