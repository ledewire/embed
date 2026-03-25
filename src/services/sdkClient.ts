import { init, sessionStorageAdapter } from "@ledewire/browser";

let _lw: ReturnType<typeof init> | null = null;

export async function createSdkClient(apiKey: string) {
  _lw = init({
    apiKey,
    storage: sessionStorageAdapter(),
    onAuthExpired: () => {
      window.dispatchEvent(new CustomEvent("lw:auth-expired"));
    },
  });
  await _lw.seller.loginWithApiKey({ key: apiKey });
  return _lw;
}

export function getSdkClient() {
  if (!_lw) throw new Error("SDK client not initialised");
  return _lw;
}
