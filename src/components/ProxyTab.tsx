import { useEffect, useRef, useState } from "react";
import { Tap } from "@mercuryworkshop/scramjet";
import type { Frame } from "@mercuryworkshop/scramjet-controller";
import { ensureController } from "../proxy/scramjet";
export default function ProxyTab({
  url,
  revision,
  onFrame,
}: {
  url: string;
  revision: number;
  onFrame: (frame: Frame | null) => void;
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
  }, [url, revision, attempt]);
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
        title="Satona Browser"
        allow="fullscreen; autoplay; gamepad; pointer-lock; clipboard-read; clipboard-write"
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
