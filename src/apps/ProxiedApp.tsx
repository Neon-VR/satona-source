import { useEffect, useRef, useState } from "react";
import { createTarget, ensureController, getController } from "../proxy/scramjet";

type Props = {
  url: string;
  title: string;
};

export default function ProxiedApp({ url, title }: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const frameRef = useRef<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      try {
        setError("");

        await ensureController();

        if (cancelled || !iframeRef.current) return;

        const controller = getController();

        if (!controller) {
          throw new Error("Scramjet controller unavailable.");
        }

        frameRef.current = controller.createFrame(iframeRef.current);
        frameRef.current.go(createTarget(url));
      } catch (err) {
        console.error(`Satona proxy failed for ${title}:`, err);

        if (!cancelled) {
          setError("The application could not be started.");
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      frameRef.current = null;
    };
  }, [url, title]);

  return (
    <div className="proxied-app">
      {error && (
        <div className="proxy-error">
          <strong>{title}</strong>
          <span>{error}</span>
        </div>
      )}

      <iframe
        ref={iframeRef}
        className="proxied-frame"
        title={title}
        allow="fullscreen; autoplay; gamepad; pointer-lock; clipboard-read; clipboard-write"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
