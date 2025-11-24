/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_USE_WP_PROXY: string;
  readonly VITE_WP_PROXY_URL: string;
  readonly VITE_ENV: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  // Add other env variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.css?inline" {
  const content: string;
  export default content;
}
