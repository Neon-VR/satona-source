import Icon from "./Icon";
import AnimatedGalaxyBackground from "./AnimatedGalaxyBackground";

export default function LaunchScreen({
  onLaunch,
}: {
  onLaunch: (mode: "legacy" | "webos") => void;
}) {
  return (
    <main className="launch-screen">
      <AnimatedGalaxyBackground />
      <div className="launch-brand">
        <img src="/satona-wordmark.png" alt="Satona" />
        <span>YOUR SPACE ON THE WEB</span>
      </div>
      <div className="launch-heading">
        <span className="section-kicker">CHOOSE YOUR EXPERIENCE</span>
        <h1>
          Make yourself
          <br />
          <em>at home.</em>
        </h1>
        <p>Launch Satona with WebOS or legacy UI?</p>
      </div>
      <div className="launch-options">
        <button
          className="launch-option ready"
          onClick={() => onLaunch("legacy")}
        >
          <div className="launch-preview">
            <div className="preview-sidebar" />
            <div className="preview-content">
              <i />
              <i />
              <i />
            </div>
          </div>
          <span className="launch-option-tag">READY TO EXPLORE</span>
          <h2>
            Legacy UI <span>↗</span>
          </h2>
          <p>
            The all-new Satona browser. Play, watch, connect, and make it yours.
          </p>
          <strong>Launch Satona →</strong>
        </button>
        <button
          className="launch-option ready webos-ready"
          onClick={() => onLaunch("webos")}
        >
          <div className="webos-preview">
            <Icon name="apps" size={56} />
            <div className="preview-dock">
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
          <span className="launch-option-tag">YOUR NEW DESKTOP</span>
          <h2>WebOS</h2>
          <p>
            A desktop-inspired experience with windows, a taskbar, and room for
            everything.
          </p>
          <strong>Launch WebOS →</strong>
        </button>
      </div>
      <p className="launch-foot">One space. Endless possibilities.</p>
    </main>
  );
}
