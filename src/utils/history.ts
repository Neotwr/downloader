import type { DownloadHistoryItem, DownloadResult, RunId } from "../types/workflow";
import { isRecord } from "./validation";

const MAX_HISTORY_SIZE = 50;

function isHistoryItem(value: unknown): value is DownloadHistoryItem {
  return isRecord(value) &&
    typeof value.url === "string" && value.url.trim() !== "" &&
    typeof value.filename === "string" && value.filename.trim() !== "" &&
    typeof value.runId === "string" && /^\d+$/.test(value.runId) &&
    typeof value.date === "string" && !Number.isNaN(Date.parse(value.date));
}

export function readDownloadHistory(): DownloadHistoryItem[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem("downloads") || "[]");
    return Array.isArray(raw) ? raw.filter(isHistoryItem) : [];
  } catch {
    return [];
  }
}

export function saveDownloadToHistory(result: DownloadResult, runId: RunId): void {
  try {
    const item: DownloadHistoryItem = {
      ...result,
      runId,
      date: new Date().toISOString(),
    };
    const history = [item, ...readDownloadHistory()].slice(0, MAX_HISTORY_SIZE);
    localStorage.setItem("downloads", JSON.stringify(history));
    window.dispatchEvent(new Event("storage"));
  } catch (err) {
    // Falhar ao persistir o histórico não invalida um download concluído.
    console.error("Falha ao salvar histórico:", err);
  }
}
