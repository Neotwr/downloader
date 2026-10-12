import type {
    ArtifactResponse,
    TriggerResponse,
    WorkflowMessage,
} from "../types/workflow";

export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function errorMessage(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback;
}

export function parseTriggerResponse(value: unknown): TriggerResponse {
    if (!isRecord(value) || typeof value.runId !== "string" || !/^\d+$/.test(value.runId)) {
        throw new Error("Resposta inválida de /trigger");
    }
    return { runId: value.runId };
}

export function parseArtifactResponse(value: unknown): ArtifactResponse {
    if (!isRecord(value) || typeof value.url !== "string" || !value.url.trim()) {
        throw new Error("Resposta inválida de /artifact");
    }
    return { url: value.url };
}

export function parseWorkflowMessage(value: unknown): WorkflowMessage {
    if (!isRecord(value)) throw new Error("Mensagem WebSocket inválida");
    switch (value.type) {
        case "pong":
            return { type: "pong" };
        case "status":
        case "error":
            if (typeof value.message === "string") {
                return { type: value.type, message: value.message };
            }
            break;
        case "done":
            if (
                typeof value.downloadUrl === "string" && value.downloadUrl.trim() &&
                typeof value.filename === "string" && value.filename.trim()
            ) {
                return {
                    type: "done",
                    downloadUrl: value.downloadUrl,
                    filename: value.filename,
                };
            }
            break;
    }
    throw new Error("Mensagem WebSocket inválida");
}

export async function readHttpError(response: Response): Promise<string> {
    const fallback = `Erro ${response.status}`;
    const text = await response.text();
    if (!text.trim()) return fallback;
    try {
        const value: unknown = JSON.parse(text);
        return isRecord(value) && typeof value.message === "string"
            ? value.message || fallback
            : fallback;
    } catch {
        return text;
    }
}
