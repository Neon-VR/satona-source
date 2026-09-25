import { useState } from "react";

export default function Browser() {
  const [url, setUrl] = useState("");

  function go() {
    if (!url.trim()) return;

    let target = url.trim();

    if (!/^https?:\/\//i.test(target)) {
      target = target.includes(".")
        ? "https://" + target
        : "https://www.google.com/search?q=" + encodeURIComponent(target);
    }

    window.location.href = target;
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#111",
        color: "white",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          height: "60px",
          minHeight: "60px",
          background: "#1c1c1c",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "0 12px",
          boxSizing: "border-box",
        }}
      >
        <button style={buttonStyle}>←</button>
        <button style={buttonStyle}>→</button>
        <button
          style={buttonStyle}
          onClick={() => window.location.reload()}
        >
          ↻
        </button>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            go();
          }}
          style={{ flex: 1 }}
        >
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Search or enter a URL"
            style={{
              width: "100%",
              height: "40px",
              boxSizing: "border-box",
              borderRadius: "10px",
              border: "1px solid #444",
              background: "#292929",
              color: "white",
              padding: "0 14px",
              fontSize: "15px",
              outline: "none",
            }}
          />
        </form>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div style={{ fontSize: "48px", fontWeight: "bold" }}>Satona</div>
        <div style={{ color: "#888" }}>
          Search the web or enter a URL
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            go();
          }}
          style={{
            display: "flex",
            gap: "8px",
            width: "min(600px, 80vw)",
            marginTop: "20px",
          }}
        >
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Search..."
            style={{
              flex: 1,
              height: "44px",
              borderRadius: "10px",
              border: "1px solid #444",
              background: "#222",
              color: "white",
              padding: "0 14px",
              fontSize: "15px",
            }}
          />

          <button
            type="submit"
            style={{
              height: "44px",
              padding: "0 22px",
              border: 0,
              borderRadius: "10px",
              background: "white",
              color: "#111",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Go
          </button>
        </form>
      </div>
    </div>
  );
}

const buttonStyle = {
  width: "40px",
  height: "40px",
  border: 0,
  borderRadius: "9px",
  background: "#292929",
  color: "white",
  fontSize: "20px",
  cursor: "pointer",
};
