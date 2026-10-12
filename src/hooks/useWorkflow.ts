import { useState, useEffect, useRef } from "react";
import { API_URL, WS_URL } from "../config/env";
import { STATUS } from "../types/workflow";
import type {
  DownloadResult,
  RunId,
  WorkflowPayload,
  WorkflowStatus,
} from "../types/workflow";
import { saveDownloadToHistory } from "../utils/history";
import {
  errorMessage,
  parseTriggerResponse,
  parseWorkflowMessage,
  readHttpError,
} from "../utils/validation";

const HEARTBEAT_INTERVAL = 10_000;
const PONG_TIMEOUT = 30_000;

export function useWorkflow() {
  const [status, setStatus] = useState<WorkflowStatus>(STATUS.IDLE);
  const [statusMsg, setStatusMsg] = useState("");
  const [result, setResult] = useState<DownloadResult | null>(null);
  const [error, setError] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof window.setInterval> | null>(null);
  const watchdogRef = useRef<ReturnType<typeof window.setInterval> | null>(null);
  const lastPongRef = useRef(0);
  const settledRef = useRef(false);

  useEffect(() => {
    return () => {
      requestRef.current?.abort();
      requestRef.current = null;
      settledRef.current = true;
      if (heartbeatRef.current !== null) window.clearInterval(heartbeatRef.current);
      if (watchdogRef.current !== null) window.clearInterval(watchdogRef.current);
      heartbeatRef.current = null;
      watchdogRef.current = null;
      const ws = wsRef.current;
      wsRef.current = null;
      ws?.close();
    };
  }, []);

  function clearHeartbeatTimers(): void {
    if (heartbeatRef.current !== null) {
      window.clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    if (watchdogRef.current !== null) {
      window.clearInterval(watchdogRef.current);
      watchdogRef.current = null;
    }
  }

  function disconnect(): void {
    settledRef.current = true;
    clearHeartbeatTimers();
    const ws = wsRef.current;
    wsRef.current = null;
    ws?.close();
  }

  function setWorkflowError(message: string): void {
    setError(message);
    setStatus(STATUS.ERROR);
  }

  function connectWebSocket(runId: RunId): void {
    const ws = new WebSocket(`${WS_URL}/runs/${runId}`);
    wsRef.current = ws;
    settledRef.current = false;
    lastPongRef.current = Date.now();

    heartbeatRef.current = window.setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
      }
    }, HEARTBEAT_INTERVAL);

    watchdogRef.current = window.setInterval(() => {
      if (!settledRef.current && Date.now() - lastPongRef.current > PONG_TIMEOUT) {
        setWorkflowError("Conexão perdida com o servidor.");
        disconnect();
      }
    }, HEARTBEAT_INTERVAL);

    ws.onmessage = (event) => {
      if (wsRef.current !== ws || settledRef.current) return;
      try {
        if (typeof event.data !== "string") {
          throw new Error("Mensagem WebSocket deve ser texto");
        }
        const raw: unknown = JSON.parse(event.data);
        const data = parseWorkflowMessage(raw);
        switch (data.type) {
          case "pong":
            lastPongRef.current = Date.now();
            break;
          case "status":
            setStatusMsg(data.message);
            break;
          case "done": {
            const download = { url: data.downloadUrl, filename: data.filename };
            setResult(download);
            setStatus(STATUS.DONE);
            saveDownloadToHistory(download, runId);
            disconnect();
            break;
          }
          case "error":
            setWorkflowError(data.message || "O workflow falhou.");
            disconnect();
            break;
        }
      } catch (err) {
        setWorkflowError(errorMessage(err, "Mensagem inválida do servidor."));
        disconnect();
      }
    };

    ws.onerror = () => {
      if (wsRef.current !== ws) return;
      setWorkflowError("Erro na conexão com o servidor.");
      disconnect();
    };

    ws.onclose = () => {
      // Um socket antigo não deve limpar os timers da próxima execução.
      if (wsRef.current !== ws) return;
      const wasSettled = settledRef.current;
      disconnect();
      if (!wasSettled) setWorkflowError("Conexão fechada pelo servidor.");
    };
  }

  async function executeWorkflow(payload: WorkflowPayload): Promise<void> {
    requestRef.current?.abort();
    disconnect();
    const controller = new AbortController();
    requestRef.current = controller;
    setError("");
    setResult(null);
    setStatus(STATUS.DISPATCHING);
    setStatusMsg("Disparando workflow...");

    try {
      const response = await fetch(`${API_URL}/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(await readHttpError(response));
      const raw: unknown = await response.json();
      const { runId } = parseTriggerResponse(raw);
      // Reset/desmontagem durante o POST não deve reabrir a conexão.
      if (requestRef.current !== controller) return;
      setStatus(STATUS.RUNNING);
      setStatusMsg("Aguardando o GitHub Actions...");
      connectWebSocket(runId);
    } catch (err) {
      if (requestRef.current !== controller || controller.signal.aborted) return;
      setWorkflowError(errorMessage(err, "Erro ao disparar o workflow."));
      disconnect();
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
    }
  }

  function resetWorkflow(): void {
    requestRef.current?.abort();
    requestRef.current = null;
    disconnect();
    setStatus(STATUS.IDLE);
    setResult(null);
    setError("");
    setStatusMsg("");
  }

  return {
    status,
    statusMsg,
    result,
    error,
    isLoading: status === STATUS.DISPATCHING || status === STATUS.RUNNING,
    executeWorkflow,
    resetWorkflow,
    setWorkflowError,
    saveDownloadToHistory,
  };
}
