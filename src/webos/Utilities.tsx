import { useState } from "react";
import { readPreference, savePreference } from "../lib/preferences";
export function Notes() {
  const [text, setText] = useState(() => readPreference("satona.os.notes", ""));
  const [error, setError] = useState("");
  return (
    <div className="os-notes">
      <header>
        <h2>A thought worth keeping.</h2>
        <span>{error || "Saved on this device"}</span>
      </header>
      <textarea
        aria-label="Notes"
        placeholder="Start anywhere…"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          try {
            savePreference("satona.os.notes", e.target.value);
            setError("");
          } catch {
            setError("Storage is full. Copy your note before closing.");
          }
        }}
      />
      <footer>{text.length.toLocaleString()} characters</footer>
    </div>
  );
}
export function Calculator() {
  const [display, setDisplay] = useState("0");
  const [left, setLeft] = useState<number | null>(null);
  const [op, setOp] = useState("");
  const [replace, setReplace] = useState(true);
  function key(value: string) {
    if (value === "AC") {
      setDisplay("0");
      setLeft(null);
      setOp("");
      setReplace(true);
      return;
    }
    if (value === "⌫") {
      setDisplay(display.length > 1 ? display.slice(0, -1) : "0");
      return;
    }
    if (value === "±") {
      setDisplay(String(-Number(display)));
      return;
    }
    if (["+", "−", "×", "÷", "="].includes(value)) {
      let result = Number(display);
      if (left !== null && op && !replace)
        result =
          op === "+"
            ? left + result
            : op === "−"
              ? left - result
              : op === "×"
                ? left * result
                : left / result;
      setDisplay(
        Number.isFinite(result)
          ? String(Number(result.toPrecision(12)))
          : "Error",
      );
      setLeft(value === "=" ? null : result);
      setOp(value === "=" ? "" : value);
      setReplace(true);
      return;
    }
    if (display.length > 15 && !replace) return;
    if (value === "." && !replace && display.includes(".")) return;
    setDisplay(replace ? (value === "." ? "0." : value) : display + value);
    setReplace(false);
  }
  return (
    <div className="os-calculator">
      <small>{left !== null ? `${left} ${op}` : "CALCULATOR"}</small>
      <output>{display}</output>
      <div>
        {[
          "AC",
          "⌫",
          "±",
          "÷",
          "7",
          "8",
          "9",
          "×",
          "4",
          "5",
          "6",
          "−",
          "1",
          "2",
          "3",
          "+",
          "0",
          ".",
          "=",
        ].map((k) => (
          <button
            className={k === "=" ? "equals" : ""}
            key={k}
            onClick={() => key(k)}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}
