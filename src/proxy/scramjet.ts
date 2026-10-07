import { ReconnectingTransport } from "./reconnecting-transport";
import { defaultConfig } from "@mercuryworkshop/scramjet";
import { Controller } from "@mercuryworkshop/scramjet-controller";

const localWispUrl =
  "wss://satona-wisp-browser-20261005.satona.workers.dev/wisp/";

export const WISP_URL =
  localStorage.getItem("satona.wisp")?.trim() ||
  import.meta.env.VITE_WISP_URL?.trim() ||
  localWispUrl;

let controller: InstanceType<typeof Controller> | null = null;
let controllerReady: Promise<InstanceType<typeof Controller>> | null = null;

async function waitForServiceWorker(
  registration: ServiceWorkerRegistration,
  timeout = 10000,
): Promise<ServiceWorker> {
  const existing = navigator.serviceWorker.controller;

  if (existing) {
    return existing;
  }

  const started = Date.now();

  while (Date.now() - started < timeout) {
    if (navigator.serviceWorker.controller) {
      return navigator.serviceWorker.controller;
    }

    if (registration.active) {
      await new Promise<void>((resolve) => setTimeout(resolve, 50));

      if (navigator.serviceWorker.controller) {
        return navigator.serviceWorker.controller;
      }
    }

    await new Promise<void>((resolve) => setTimeout(resolve, 50));
  }

  throw new Error(
    "Scramjet service worker did not take control. Reload the browser and try again.",
  );
}

export async function ensureController() {
  if (!window.isSecureContext || !("serviceWorker" in navigator)) {
    throw new Error(
      "The browser requires HTTPS or localhost with service worker support.",
    );
  }
  if (controller) {
    return controller;
  }

  if (controllerReady) {
    return controllerReady;
  }

  controllerReady = (async () => {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });

    const serviceWorker = await waitForServiceWorker(registration);

    const transport = new ReconnectingTransport({
      wisp: WISP_URL,
      engine:
        localStorage.getItem("satona.transport") === "libcurl"
          ? "libcurl"
          : "epoxy",
      httpRelay:
        new URL(WISP_URL).origin === new URL(localWispUrl).origin
          ? new URL("/fetch", localWispUrl.replace(/^ws/, "http")).href
          : undefined,
    });

    const nextController = new Controller({
      serviceworker: serviceWorker,
      transport,
      scramjetConfig: defaultConfig,
    });

    await Promise.race([
      nextController.wait(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                "The browser relay did not initialize. Check your Wisp endpoint in Settings.",
              ),
            ),
          20000,
        ),
      ),
    ]);

    controller = nextController;

    return nextController;
  })();

  try {
    return await controllerReady;
  } catch (error) {
    controllerReady = null;
    controller = null;
    throw error;
  }
}

export function getController() {
  return controller;
}

export async function createFrame(iframe: HTMLIFrameElement) {
  const instance = await ensureController();

  return instance.createFrame(iframe);
}

export function createTarget(value: string, searchEngine = "google"): string {
  const input = value.trim();

  if (!input) {
    return "";
  }

  if (/^(https?:\/\/|about:blank|data:|blob:)/i.test(input)) {
    return input;
  }

  if (
    /^localhost(:\d+)?(\/.*)?$/i.test(input) ||
    /^127\.0\.0\.1(:\d+)?(\/.*)?$/i.test(input)
  ) {
    return `http://${input}`;
  }

  if (/^[a-z0-9.-]+\.[a-z]{2,}(:\d+)?([/?#].*)?$/i.test(input)) {
    return `https://${input}`;
  }

  const engines: Record<string, string> = {
    google: "https://www.google.com/search?q=",
    duckduckgo: "https://duckduckgo.com/?q=",
    bing: "https://www.bing.com/search?q=",
    brave: "https://search.brave.com/search?q=",
    ecosia: "https://www.ecosia.org/search?q=",
    startpage: "https://www.startpage.com/do/search?query=",
  };

  return `${
    engines[searchEngine] || engines.google
  }${encodeURIComponent(input)}`;
}
