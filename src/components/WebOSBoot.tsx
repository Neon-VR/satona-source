import { useEffect, useRef } from "react";
import { readPreference } from "../lib/preferences";
import "./webos-boot.css";
export default function WebOSBoot({ onComplete }: { onComplete: () => void }) {
  const complete = useRef(onComplete);
  complete.current = onComplete;
  useEffect(() => {
    const timer = setTimeout(() => complete.current(), 5000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div
      className={`webos-boot ${readPreference("satona.motion", true) ? "" : "boot-still"}`}
      role="status"
      aria-label="Starting Satona WebOS"
    >
      <img src="/satona-emblem.png" alt="Satona" />
      <div className="boot-progress" />
      <span>STARTING WEBOS</span>
    </div>
  );
}
