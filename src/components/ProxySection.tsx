import { useEffect, useRef } from "react";
import { ExternalIcon } from "./Icons";

type Props = {
  title: string;
  description: string;
  url: string;
  onOpen: (url: string) => void;
};

export default function ProxySection({
  title,
  description,
  url,
  onOpen,
}: Props) {
  const iframe = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    onOpen(url);
  }, [url, onOpen]);

  return (
    <section className="satona-proxy-section">
      <div className="satona-proxy-header">
        <div>
          <span className="satona-kicker">WEB APP</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        <button onClick={() => onOpen(url)}>
          <ExternalIcon />
          Open
        </button>
      </div>

      <iframe
        ref={iframe}
        className="satona-section-frame"
        title={title}
        src="about:blank"
        allow="fullscreen; autoplay; clipboard-read; clipboard-write"
      />
    </section>
  );
}
