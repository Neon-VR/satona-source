import { useEffect, useRef, useState } from "react";
import { Tap } from "@mercuryworkshop/scramjet";
import type { Frame } from "@mercuryworkshop/scramjet-controller";
import { ensureController } from "../proxy/scramjet";
export default function ProxyTab({
  url,
  revision,
  onFrame,
  gameDocument = false,
  title = "Satona Browser",
}: {
  url: string;
  revision: number;
  onFrame: (frame: Frame | null) => void;
  gameDocument?: boolean;
  title?: string;
}) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const frame = useRef<Frame | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [attempt, setAttempt] = useState(0);
  const callback = useRef(onFrame);
  callback.current = onFrame;
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    void (async () => {
      try {
        const controller = await ensureController();
        if (cancelled || !iframe.current) return;
        if (!frame.current) {
          const next = controller.createFrame(iframe.current);
          frame.current = next;
          callback.current(next);
          if (gameDocument)
            Tap.tap(next.hooks.fetch.preresponse, (context, props) => {
              // GitHub serves HTML as text/plain. Set the document MIME
              // before Scramjet rewrites it, only for this selected game URL.
              const target = context.parsed.url;
              const documentRequest =
                target.href === url &&
                ["document", "iframe"].includes(context.parsed.destination);
              const assetType =
                target.hostname === "raw.githubusercontent.com" &&
                target.pathname.startsWith("/gn-math/assets/main/")
                  ? (
                      {
                        js: "text/javascript",
                        mjs: "text/javascript",
                        css: "text/css",
                        wasm: "application/wasm",
                      } as Record<string, string>
                    )[target.pathname.split(".").pop() ?? ""]
                  : undefined;
              const contentType = documentRequest
                ? "text/html; charset=utf-8"
                : assetType;
              if (contentType && props.response.status === 200) {
                props.response.headers.set("content-type", contentType);
                props.response.rawHeaders = props.response.rawHeaders.filter(
                  ([name]: [string, string]) =>
                    name.toLowerCase() !== "content-type",
                );
                props.response.rawHeaders.push(["content-type", contentType]);
              }
            });
          Tap.tap(
            next.hooks.error.request,
            (context: {
              rawrequest: { destination?: string };
              error: unknown;
            }) => {
              if (
                context.rawrequest.destination === "iframe" ||
                context.rawrequest.destination === "document"
              ) {
                setLoading(false);
                setError(
                  "The relay could not reach this page. Retry, or choose a different Wisp endpoint in Settings.",
                );
              }
            },
          );
        }
        frame.current.go(url);
        timeout.current = setTimeout(() => {
          if (!cancelled) {
            setLoading(false);
            setError(
              "This page is taking longer than expected. Retry or check your relay in Settings.",
            );
          }
        }, 25000);
      } catch (cause) {
        if (!cancelled) {
          setLoading(false);
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not start the browser.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(timeout.current);
    };
  }, [url, revision, attempt, gameDocument]);
  useEffect(
    () => () => {
      if (frame.current) {
        const controller = frame.current.controller;
        controller.frames = controller.frames.filter(
          (item) => item !== frame.current,
        );
        frame.current = null;
      }
      callback.current(null);
    },
    [],
  );
  return (
    <div className="browser-frame-container">
      <iframe
        ref={iframe}
        className="browser-frame"
        title={title}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads allow-pointer-lock allow-presentation"
        allow="fullscreen; autoplay; encrypted-media; picture-in-picture; gamepad; clipboard-read; clipboard-write"
        onLoad={() => {
          if (iframe.current?.getAttribute("src")) {
            setLoading(false);
            clearTimeout(timeout.current);
          }
        }}
      />
      {(loading || error) && (
        <div className="browser-status" role="status">
          {error || "Connecting to your destination…"}
          {error && (
            <button onClick={() => setAttempt((value) => value + 1)}>
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
