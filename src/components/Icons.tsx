import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function HomeIcon(p: IconProps) {
  return <svg {...base} {...p}><path d="M3 10.8 12 3l9 7.8"/><path d="M5.5 9.8V21h13V9.8"/><path d="M9.5 21v-6h5v6"/></svg>;
}

export function GameIcon(p: IconProps) {
  return <svg {...base} {...p}><path d="M7.5 8h9a4.5 4.5 0 0 1 4.3 5.9l-1.2 3.7a2.5 2.5 0 0 1-4.5.6l-1.1-1.7h-4l-1.1 1.7a2.5 2.5 0 0 1-4.5-.6l-1.2-3.7A4.5 4.5 0 0 1 7.5 8Z"/><path d="M7 11v4M5 13h4"/><path d="M16.5 12.5h.01M18.5 14.5h.01"/></svg>;
}

export function MovieIcon(p: IconProps) {
  return <svg {...base} {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m8 5 3 4M14 5l3 4M8 19l3-4M14 19l3-4"/><path d="M3 9h18M3 15h18"/></svg>;
}

export function MusicIcon(p: IconProps) {
  return <svg {...base} {...p}><path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="3"/><circle cx="16.5" cy="16" r="3"/></svg>;
}

export function ChatIcon(p: IconProps) {
  return <svg {...base} {...p}><path d="M5 5.5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-5 3v-3.3a2 2 0 0 1-2-2v-7.7a2 2 0 0 1 2-2Z"/><path d="M7 10h10M7 13.5h6"/></svg>;
}

export function YoutubeIcon(p: IconProps) {
  return <svg {...base} {...p}><rect x="3" y="6" width="18" height="12" rx="3"/><path d="m10 9 5 3-5 3V9Z" fill="currentColor" stroke="none"/></svg>;
}

export function SettingsIcon(p: IconProps) {
  return <svg {...base} {...p}><path d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M18 6l-1.4 1.4M7.4 16.6 6 18M18 18l-1.4-1.4M7.4 7.4 6 6"/><circle cx="12" cy="12" r="4"/></svg>;
}

export function ArrowLeftIcon(p: IconProps) {
  return <svg {...base} {...p}><path d="M19 12H5M11 6l-6 6 6 6"/></svg>;
}

export function ArrowRightIcon(p: IconProps) {
  return <svg {...base} {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
}

export function RefreshIcon(p: IconProps) {
  return <svg {...base} {...p}><path d="M20 11a8 8 0 1 0 1 4"/><path d="M20 5v6h-6"/></svg>;
}

export function PlusIcon(p: IconProps) {
  return <svg {...base} {...p}><path d="M12 5v14M5 12h14"/></svg>;
}

export function SearchIcon(p: IconProps) {
  return <svg {...base} {...p}><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>;
}

export function PlayIcon(p: IconProps) {
  return <svg {...base} {...p}><path d="m9 6 9 6-9 6V6Z" fill="currentColor" stroke="none"/></svg>;
}

export function PauseIcon(p: IconProps) {
  return <svg {...base} {...p}><path d="M8 6v12M16 6v12"/></svg>;
}

export function BookmarkIcon(p: IconProps) {
  return <svg {...base} {...p}><path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.5L6 21V4.5Z"/></svg>;
}

export function ExternalIcon(p: IconProps) {
  return <svg {...base} {...p}><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/></svg>;
}

export function FullscreenIcon(p: IconProps) {
  return <svg {...base} {...p}><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M21 16v5h-5"/></svg>;
}

export function SplitIcon(p: IconProps) {
  return <svg {...base} {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16"/></svg>;
}

export function XIcon(p: IconProps) {
  return <svg {...base} {...p}><path d="m6 6 12 12M18 6 6 18"/></svg>;
}

export function ChevronDownIcon(p: IconProps) {
  return <svg {...base} {...p}><path d="m6 9 6 6 6-6"/></svg>;
}

export function UploadIcon(p: IconProps) {
  return <svg {...base} {...p}><path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/></svg>;
}

export function DiscordIcon(p: IconProps) {
  return <svg {...base} {...p}><path d="M7.2 7.1A13 13 0 0 1 12 6a13 13 0 0 1 4.8 1.1c1.5 2 2.3 4.4 2.2 7.1a12.5 12.5 0 0 1-4.2 2.1l-.9-1.2M7.2 7.1A13.5 13.5 0 0 0 5 14.2a12.5 12.5 0 0 0 4.2 2.1l.9-1.2"/><circle cx="9" cy="12" r=".8" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r=".8" fill="currentColor" stroke="none"/></svg>;
}

export function MoreIcon(p: IconProps) {
  return <svg {...base} {...p}><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></svg>;
}
