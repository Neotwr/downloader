interface ImportMetaEnv {
    readonly VITE_API_URL?: string;
    readonly VITE_WORKFLOW_URL?: string;
    readonly VITE_WORKFLOW_PYTHON?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
