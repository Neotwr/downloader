export const STATUS = {
    IDLE: "idle",
    DISPATCHING: "dispatching",
    RUNNING: "running",
    DONE: "done",
    ERROR: "error",
} as const;

export type WorkflowStatus = (typeof STATUS)[keyof typeof STATUS];
export type RunId = string;

export interface DownloadResult {
    url: string;
    filename: string;
}

export interface DownloadHistoryItem extends DownloadResult {
    runId: RunId;
    date: string;
}

export interface UrlInputs {
    app_name: string;
    app_link: string;
    extensao: string;
}

export interface PythonInputs {
    package: string;
}

export type WorkflowPayload =
    | { id: "URLDownload"; inputs: UrlInputs }
    | { id: "PyDownload"; inputs: PythonInputs };

export interface TriggerResponse {
    runId: RunId;
}

export interface ArtifactResponse {
    url: string;
}

export type WorkflowMessage =
    | { type: "pong" }
    | { type: "status"; message: string }
    | { type: "done"; downloadUrl: string; filename: string }
    | { type: "error"; message: string };
