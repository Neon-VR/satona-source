import Icon from "./Icon";

export default function LaunchScreen({ onLaunch }: { onLaunch: () => void }) {
  return (
    <main className="launch-screen">
      <div className="launch-brand">
        <img src="/satona-logo.png" alt="" /> satona
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
        <button className="launch-option ready" onClick={onLaunch}>
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
        <button className="launch-option future" disabled>
          <div className="webos-preview">
            <Icon name="apps" size={56} />
            <div className="preview-dock">
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
          <span className="launch-option-tag">COMING SOON</span>
          <h2>WebOS</h2>
          <p>
            A desktop-inspired experience with windows, a taskbar, and room for
            everything.
          </p>
          <strong>In the making</strong>
        </button>
      </div>
      <p className="launch-foot">One space. Endless possibilities.</p>
    </main>
  );
}
