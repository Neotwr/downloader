type EnvName =
    | "VITE_API_URL"
    | "VITE_WORKFLOW_URL"
    | "VITE_WORKFLOW_PYTHON";

function requiredEnv(name: EnvName): string {
    const value = import.meta.env[name]?.trim();
    if (!value) throw new Error(`Variável de ambiente ausente: ${name}`);
    return value;
}

function workflowEnv<T extends "URLDownload" | "PyDownload">(
    name: EnvName,
    expected: T,
): T {
    const value = requiredEnv(name);
    if (value !== expected) {
        throw new Error(`${name} deve ser ${expected}`);
    }
    return expected;
}

const api = new URL(requiredEnv("VITE_API_URL"));
if (api.protocol !== "http:" && api.protocol !== "https:") {
    throw new Error("VITE_API_URL deve usar HTTP ou HTTPS");
}

export const API_URL = api.toString().replace(/\/$/, "");
export const WORKFLOW_URL = workflowEnv("VITE_WORKFLOW_URL", "URLDownload");
export const WORKFLOW_PYTHON = workflowEnv("VITE_WORKFLOW_PYTHON", "PyDownload");

const socket = new URL(API_URL);
socket.protocol = api.protocol === "https:" ? "wss:" : "ws:";
export const WS_URL = socket.toString().replace(/\/$/, "");
