import { useState, useEffect, useRef } from "react";

export const STATUS = {
  IDLE: "idle",
  DISPATCHING: "dispatching",
  RUNNING: "running",
  DONE: "done",
  ERROR: "error",
};

const MAX_HISTORY_SIZE = 50; // Manter últimos 50 downloads

// Protocolo de heartbeat (cliente -> servidor)
const HEARTBEAT_INTERVAL = 10000; // envia ping a cada 10s
const PONG_TIMEOUT = 30000; // sem pong por 30s -> conexão perdida

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
  const heartbeatRef = useRef(null);
  const watchdogRef = useRef(null);
  const lastPongRef = useRef(0);
  const settledRef = useRef(false);

  // 2. Limpeza: se o usuário mudar de aba, fechamos o WebSocket e os timers
  useEffect(() => {
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (watchdogRef.current) clearInterval(watchdogRef.current);
      wsRef.current?.close();
    };
  }, []);

  const validateEnvVars = () => {
    if (!import.meta.env.VITE_API_URL) {
      throw new Error(
        `❌ Variáveis de ambiente faltando: VITE_API_URL`,
      );
    }
  };

  if (typeof window !== "undefined") {
    validateEnvVars();
  }

  function clearHeartbeatTimers() {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    if (watchdogRef.current) {
      clearInterval(watchdogRef.current);
      watchdogRef.current = null;
    }
  }

  function connectWebSocket(runId) {
    const ws = new WebSocket(`${wsUrl}/runs/${runId}`);
    wsRef.current = ws;
    settledRef.current = false;
    lastPongRef.current = Date.now();

    // Heartbeat: envia ping a cada 10s para o backend saber que a conexão está viva
    heartbeatRef.current = setInterval(() => {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({ type: "ping" }));
      }
    }, HEARTBEAT_INTERVAL);

    // Watchdog: se o servidor ficar mudo por 30s, considera a conexão perdida
    watchdogRef.current = setInterval(() => {
      if (Date.now() - lastPongRef.current > PONG_TIMEOUT) {
        settledRef.current = true;
        setWorkflowError("Conexão perdida com o servidor.");
        ws.close();
      }
    }, HEARTBEAT_INTERVAL);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "pong") {
        lastPongRef.current = Date.now();
        return;
      }
      if (data.type === "status") {
        setStatusMsg(data.message);
        return;
      }
      if (data.type === "done") {
        settledRef.current = true;
        const result = { url: data.downloadUrl, filename: data.filename };
        setResult(result);
        setStatus(STATUS.DONE);
        saveDownloadToHistory(result, runId); // salvando historico de download no localStorage

        ws.close();
        return;
      }
      if (data.type === "error") {
        settledRef.current = true;
        setWorkflowError(data.message || "O workflow falhou.");
        ws.close();
      }
    };

    ws.onerror = () => {
      settledRef.current = true;
      setWorkflowError("Erro na conexão com o servidor.");
    };

    ws.onclose = () => {
      clearHeartbeatTimers();
      if (wsRef.current === ws) wsRef.current = null;
      if (!settledRef.current) {
        setWorkflowError("Conexão fechada pelo servidor.");
      }
    };
  }

  // 3. A Função principal: Repare que ela recebe um 'payload' genérico
  async function executeWorkflow(payload) {
    settledRef.current = true;
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
        body: JSON.stringify(payload),
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
    settledRef.current = true;
    clearHeartbeatTimers();
    setStatus(STATUS.IDLE);
    setResult(null);
    setError("");
    setStatusMsg("");
    wsRef.current?.close();
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
