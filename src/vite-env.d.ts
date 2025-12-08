/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_ENV: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_API_KEY?: string;
  readonly VITE_API_SECRET?: string;
  readonly VITE_APT_SECRET?: string;
  // Add other env variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.css?inline" {
  const content: string;
  export default content;
}
