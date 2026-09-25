import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from "react";
import Icon from "./Icon";

export type WindowState = {
  id: string;
  title: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  appId: string;
};

type Props = {
  windows: WindowState[];
  renderWindow: (window: WindowState) => ReactNode;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onFocus: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
};

export default function WindowManager({
  windows,
  renderWindow,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onMove,
}: Props) {
  return (
    <>
      {windows.map((window) => (
        <FloatingWindow
          key={window.id}
          state={window}
          onClose={() => onClose(window.id)}
          onMinimize={() => onMinimize(window.id)}
          onMaximize={() => onMaximize(window.id)}
          onFocus={() => onFocus(window.id)}
          onMove={(x, y) => onMove(window.id, x, y)}
        >
          {renderWindow(window)}
        </FloatingWindow>
      ))}
    </>
  );
}

function FloatingWindow({
  state,
  children,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onMove,
}: {
  state: WindowState;
  children: ReactNode;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onFocus: () => void;
  onMove: (x: number, y: number) => void;
}) {
  const drag = useRef<{
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const [, setDragging] = useState(false);

  useEffect(() => {
    const move = (event: MouseEvent) => {
      if (!drag.current || state.maximized) return;

      onMove(
        Math.max(0, event.clientX - drag.current.offsetX),
        Math.max(0, event.clientY - drag.current.offsetY)
      );
    };

    const up = () => {
      drag.current = null;
      setDragging(false);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [onMove, state.maximized]);

  const startDrag = (event: ReactMouseEvent) => {
    if (state.maximized) return;

    const target = event.target as HTMLElement;

    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest("select")
    ) {
      return;
    }

    drag.current = {
      offsetX: event.clientX - state.x,
      offsetY: event.clientY - state.y,
    };

    setDragging(true);
    onFocus();
  };

  if (state.minimized) return null;

  return (
    <section
      className={`os-window ${state.maximized ? "maximized" : ""}`}
      style={{
        left: state.maximized ? 0 : state.x,
        top: state.maximized ? 0 : state.y,
        width: state.maximized ? "100%" : state.width,
        height: state.maximized ? "calc(100% - 72px)" : state.height,
        zIndex: state.z,
      }}
      onMouseDown={onFocus}
    >
      <header className="window-titlebar" onMouseDown={startDrag}>
        <div className="window-title">
          <Icon name={state.icon} size={17} />
          <span>{state.title}</span>
        </div>

        <div className="window-controls">
          <button onClick={onMinimize} title="Minimize">
            <Icon name="minimize" size={15} />
          </button>
          <button onClick={onMaximize} title="Maximize">
            <Icon name="maximize" size={14} />
          </button>
          <button className="window-close" onClick={onClose} title="Close">
            <Icon name="close" size={15} />
          </button>
        </div>
      </header>

      <div className="window-content">{children}</div>
    </section>
  );
}
