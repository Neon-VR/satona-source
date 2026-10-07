import Browser from "./Browser";
import StudyGuidesGate, {
  hasStudyGuidesAccess,
} from "./components/StudyGuidesGate";
import { useEffect, useState } from "react";
import LaunchScreen from "./components/LaunchScreen";
import WebOS from "./webos/WebOS";
import { applyPreferences } from "./lib/preferences";
import "./index.css";
import "./redesign.css";

export default function App() {
  const unlocked = hasStudyGuidesAccess();
  const [launched, setLaunched] = useState<"legacy" | "webos" | null>(null);

  useEffect(() => {
    if (unlocked) {
      applyPreferences();
      window.addEventListener("satona-preferences", applyPreferences);
      return () =>
        window.removeEventListener("satona-preferences", applyPreferences);
    }
    document.title = "Study Guides";
    const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (favicon) {
      favicon.href = unlocked ? "/satona-logo.png" : "/study-guides-icon.svg";
    }
  }, [unlocked]);

  return unlocked ? (
    launched ? (
      launched === "webos" ? (
        <WebOS onExit={() => setLaunched(null)} />
      ) : (
        <Browser />
      )
    ) : (
      <LaunchScreen onLaunch={setLaunched} />
    )
  ) : (
    <StudyGuidesGate />
  );
}
