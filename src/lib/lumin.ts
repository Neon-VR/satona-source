export type LuminGame = {
  id: string;
  name: string;
  category?: string;
  image_token?: string;
};
type LuminSDK = {
  init: (options: { headless: boolean }) => Promise<void>;
  getGames: (options: {
    page: number;
    limit: number;
    q: string;
  }) => Promise<{ games: LuminGame[]; pages: number; total: number }>;
  getGameUrl: (id: string) => Promise<{ url: string }>;
  getImageUrl: (token: string) => Promise<string>;
};
declare global {
  interface Window {
    Lumin?: LuminSDK;
  }
}
let ready: Promise<LuminSDK> | null = null;
export function loadLumin() {
  if (ready) return ready;
  ready = (async () => {
    if (!window.Lumin)
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src =
          "https://cdn.jsdelivr.net/gh/luminsdk/script@latest/lumin.min.js";
        script.async = true;
        const timer = setTimeout(() => {
          script.remove();
          reject(new Error("LuminSDK took too long to load."));
        }, 15000);
        script.onload = () => {
          clearTimeout(timer);
          resolve();
        };
        script.onerror = () => {
          clearTimeout(timer);
          script.remove();
          reject(new Error("LuminSDK is unavailable."));
        };
        document.head.append(script);
      });
    if (!window.Lumin) throw new Error("LuminSDK is unavailable.");
    await window.Lumin.init({ headless: true });
    return window.Lumin;
  })().catch((error) => {
    ready = null;
    throw error;
  });
  return ready;
}
