import Icon from "./Icon";
type Props = {
  tabs: { id: string; title: string; url: string }[];
  activeTab: string;
  address: string;
  onTab: (id: string) => void;
  onClose: (id: string) => void;
  onNewTab: () => void;
  onAddress: (value: string) => void;
  onNavigate: () => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onHome: () => void;
  onFullscreen: () => void;
  onBookmark: () => void;
  bookmarked: boolean;
};
export default function BrowserChrome(props: Props) {
  return (
    <header className="browser-chrome">
      <div className="browser-tabs">
        {props.tabs.map((tab) => (
          <div
            key={tab.id}
            className={`chrome-tab ${props.activeTab === tab.id ? "active" : ""}`}
          >
            <button
              style={{ background: "none", color: "inherit", padding: 0 }}
              onClick={() => props.onTab(tab.id)}
            >
              <span className="chrome-tab-title">{tab.title || "New Tab"}</span>
            </button>
            <button
              className="close-tab"
              aria-label={`Close ${tab.title}`}
              onClick={() => props.onClose(tab.id)}
            >
              <Icon name="x" size={12} />
            </button>
          </div>
        ))}
        <button
          className="chrome-add-tab"
          onClick={props.onNewTab}
          title="New tab"
        >
          <Icon name="plus" size={16} />
        </button>
      </div>
      <div className="browser-nav">
        <div className="browser-nav-buttons">
          <button onClick={props.onBack} title="Back">
            <Icon name="back" size={17} />
          </button>
          <button onClick={props.onForward} title="Forward">
            <Icon name="forward" size={17} />
          </button>
          <button onClick={props.onReload} title="Reload">
            <Icon name="refresh" size={17} />
          </button>
          <button onClick={props.onHome} title="Home">
            <Icon name="home" size={17} />
          </button>
        </div>
        <form
          className="address-bar"
          onSubmit={(event) => {
            event.preventDefault();
            props.onNavigate();
          }}
        >
          <Icon name="search" size={15} />
          <input
            aria-label="Address bar"
            value={props.address}
            onChange={(event) => props.onAddress(event.target.value)}
            placeholder="Search or enter a URL"
          />
        </form>
        <div className="browser-tools">
          <button
            className={props.bookmarked ? "saved" : ""}
            disabled={
              !props.tabs.find((tab) => tab.id === props.activeTab)?.url
            }
            onClick={props.onBookmark}
            title={props.bookmarked ? "Remove bookmark" : "Bookmark"}
          >
            <Icon name="bookmark" size={17} />
          </button>
          <button onClick={props.onFullscreen} title="Fullscreen">
            <Icon name="fullscreen" size={17} />
          </button>
        </div>
      </div>
    </header>
  );
}
