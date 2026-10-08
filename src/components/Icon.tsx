type Props = {
  name: string;
  size?: number;
};

export default function Icon({ name, size = 20 }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "minecraft":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
          <path fill="#815634" d="m2 9 14 7v15L2 24z" />
          <path fill="#593d29" d="m16 16 14-7v15l-14 7z" />
          <path fill="#8bc34c" d="M2 9 16 2l14 7-14 7z" />
          <path fill="#5e962d" d="m2 9 14 7v6l-4-2v-3l-4-2v3l-6-3z" />
          <path fill="#417426" d="m16 16 14-7v6l-4 2v-3l-5 3v3l-5 2z" />
          <path fill="#ad784b" d="m5 21 4 2v3l-4-2zm7 2 3 2v3l-3-2z" />
          <path fill="#a1d166" d="m9 8 6-3 6 3-6 3z" />
        </svg>
      );
    case "steam":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 0a12 12 0 0 0-11.96 11l6.43 2.67a3.4 3.4 0 0 1 1.87-.55l3.04-4.4v-.06a4.51 4.51 0 1 1 4.51 4.52h-.1l-4.33 3.1a3.42 3.42 0 0 1-6.78.67L.08 14.9A12 12 0 1 0 12 0ZM7.52 19.26a2.62 2.62 0 0 0 2-4.84l-1.61-.66a1.95 1.95 0 0 1 1.63 3.55 1.94 1.94 0 0 1-1.5 0l-1.57-.65a2.62 2.62 0 0 0 1.05 2.6ZM15.9 11.66a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0-.76a2.24 2.24 0 1 1 0-4.48 2.24 2.24 0 0 1 0 4.48Z" />
        </svg>
      );
    case "globe":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <ellipse cx="12" cy="12" rx="4" ry="9" />
          <path d="M3 12h18M5 7h14M5 17h14" />
        </svg>
      );
    case "files":
      return (
        <svg {...common}>
          <path d="M3 7a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v9H3Z" />
          <path d="M3 10h18" />
        </svg>
      );
    case "lock":
      return (
        <svg {...common}>
          <rect x="5" y="10" width="14" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
        </svg>
      );
    case "cloud":
      return (
        <svg {...common}>
          <path d="M7 18h11a4 4 0 0 0 .7-7.9A7 7 0 0 0 5 9a4.5 4.5 0 0 0 2 9Z" />
          <path d="m10 11-2 3h4l-1 3 5-5h-4l1-3" />
        </svg>
      );
    case "apps":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="2" />
          <rect x="14" y="3" width="7" height="7" rx="2" />
          <rect x="3" y="14" width="7" height="7" rx="2" />
          <rect x="14" y="14" width="7" height="7" rx="2" />
        </svg>
      );
    case "home":
      return (
        <svg {...common}>
          <path d="m3 10 9-7 9 7" />
          <path d="M5 9v11h14V9" />
          <path d="M9 20v-6h6v6" />
        </svg>
      );

    case "games":
      return (
        <svg {...common}>
          <path d="M7 7h10a5 5 0 0 1 4.7 6.7l-1.2 3.1a2.5 2.5 0 0 1-4.5.3L15 15H9l-1 2.1a2.5 2.5 0 0 1-4.5-.3l-1.2-3.1A5 5 0 0 1 7 7Z" />
          <path d="M7 11v4M5 13h4M16 12h.01M19 12h.01" />
        </svg>
      );

    case "movies":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 9h18M7 5l2 4M12 5l2 4M17 5l2 4M7 15l2 4M12 15l2 4M17 15l2 4" />
        </svg>
      );

    case "music":
      return (
        <svg {...common}>
          <path d="M9 18V5l10-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="16" cy="16" r="3" />
        </svg>
      );

    case "chat":
      return (
        <svg {...common}>
          <path d="M4 5h16v11H8l-4 4V5Z" />
          <path d="M8 9h8M8 12h5" />
        </svg>
      );

    case "youtube":
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="12" rx="3" />
          <path d="m10 9 5 3-5 3V9Z" fill="currentColor" stroke="none" />
        </svg>
      );

    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.1h-2.6v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.5-1H6v-2.6h.5A1.7 1.7 0 0 0 8 10a1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V5h2.6v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1V14h-.1a1.7 1.7 0 0 0-1.5 1Z" />
        </svg>
      );

    case "back":
      return (
        <svg {...common}>
          <path d="m15 18-6-6 6-6" />
        </svg>
      );

    case "forward":
      return (
        <svg {...common}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      );

    case "refresh":
      return (
        <svg {...common}>
          <path d="M20 11a8 8 0 1 0 1 4" />
          <path d="M20 5v6h-6" />
        </svg>
      );

    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );

    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
      );

    case "play":
      return (
        <svg {...common}>
          <path d="m9 6 9 6-9 6V6Z" fill="currentColor" stroke="none" />
        </svg>
      );

    case "pause":
      return (
        <svg {...common}>
          <path d="M8 6v12M16 6v12" />
        </svg>
      );

    case "bookmark":
      return (
        <svg {...common}>
          <path d="M6 4h12v17l-6-4-6 4V4Z" />
        </svg>
      );

    case "external":
      return (
        <svg {...common}>
          <path d="M14 5h5v5M19 5l-9 9" />
          <path d="M19 13v5H5V5h5" />
        </svg>
      );

    case "fullscreen":
      return (
        <svg {...common}>
          <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M21 16v5h-5" />
        </svg>
      );

    case "split":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M12 4v16" />
        </svg>
      );

    case "x":
      return (
        <svg {...common}>
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      );

    case "discord":
      return (
        <svg {...common}>
          <path d="M7 7.5A14 14 0 0 1 12 6a14 14 0 0 1 5 1.5" />
          <path d="M6 8c-1.5 2-2 4.5-2 7 2 2 4.5 3 8 3s6-1 8-3c0-2.5-.5-5-2-7" />
          <circle cx="9" cy="12" r="1" />
          <circle cx="15" cy="12" r="1" />
        </svg>
      );

    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}
