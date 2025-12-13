/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  VITE_APP_NODE_ENV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
