import Browser from "./Browser";
import StudyGuidesGate, { hasStudyGuidesAccess } from "./components/StudyGuidesGate";
import { useEffect } from "react";
import "./index.css";

export default function App() {
  const unlocked = hasStudyGuidesAccess();

  useEffect(() => {
    document.title = unlocked ? "Satona" : "Study Guides";
    const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (favicon) {
      favicon.href = unlocked ? "/satona-logo.png" : "/study-guides-icon.svg";
    }
  }, [unlocked]);

  return unlocked ? <Browser /> : <StudyGuidesGate />;
}
