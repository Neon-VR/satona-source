import StudyGuidesGate, {
  hasStudyGuidesAccess,
} from "./components/StudyGuidesGate";
import { useEffect, useState } from "react";
import LaunchScreen from "./components/LaunchScreen";
import WebOS from "./webos/WebOS";
import WebOSBoot from "./components/WebOSBoot";
import { applyPreferences } from "./lib/preferences";
import "./index.css";
import "./redesign.css";

export default function App() {
  const unlocked = hasStudyGuidesAccess();
  const [launched, setLaunched] = useState(false);
  const [booting, setBooting] = useState(false);
  const [accountRevision, setAccountRevision] = useState(0);
  useEffect(() => {
    const restored = () => setAccountRevision((value) => value + 1);
    window.addEventListener("satona-account-restored", restored);
    return () =>
      window.removeEventListener("satona-account-restored", restored);
  }, []);

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
    booting ? (
      <WebOSBoot
        onComplete={() => {
          setBooting(false);
          setLaunched(true);
        }}
      />
    ) : launched ? (
      <WebOS key={accountRevision} onExit={() => setLaunched(false)} />
    ) : (
      <LaunchScreen onLaunch={() => setBooting(true)} />
    )
  ) : (
    <StudyGuidesGate />
  );
}
