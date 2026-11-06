"use client";

import { useId, useRef, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { Folder, Maximize2, Minimize2, Minus, Monitor, X } from "lucide-react";
import { boundWindowPosition, resizeWindowBounds, type DesktopAction, type DesktopWindowState, type ResizeEdge, type WindowRect } from "./desktopState";

const resizeEdges: { edge: ResizeEdge; label: string }[] = [
  { edge: "n", label: "top edge" }, { edge: "s", label: "bottom edge" },
  { edge: "e", label: "right edge" }, { edge: "w", label: "left edge" },
  { edge: "ne", label: "top right corner" }, { edge: "nw", label: "top left corner" },
  { edge: "se", label: "bottom right corner" }, { edge: "sw", label: "bottom left corner" },
];

type Props = {
  window: DesktopWindowState;
  title: string;
  active: boolean;
  zIndex: number;
  dispatch: (action: DesktopAction) => void;
  children: ReactNode;
  status: string;
};

export default function DesktopWindow({ window, title, active, zIndex, dispatch, children, status }: Props) {
  const helpId = useId();
  const resizeHelpId = useId();
  const drag = useRef<({ pointer: number; startX: number; startY: number; scaleX: number; scaleY: number; edge: ResizeEdge | "move" } & WindowRect) | null>(null);

  function move(element: HTMLElement, x: number, y: number) {
    const desktop = element.parentElement!;
    const position = boundWindowPosition(x, y, desktop.clientWidth, desktop.clientHeight, element.offsetWidth, element.offsetHeight);
    dispatch({ type: "move", id: window.id, ...position });
  }

  function startDrag(event: PointerEvent<HTMLElement>, edge: ResizeEdge | "move" = "move") {
    if (event.button !== 0 || window.maximized || (edge === "move" && (event.target as Element).closest("button"))) return;
    const element = event.currentTarget.parentElement!;
    const desktop = element.parentElement!;
    const bounds = desktop.getBoundingClientRect();
    drag.current = { pointer: event.pointerId, startX: event.clientX, startY: event.clientY, x: element.offsetLeft, y: element.offsetTop, width: element.offsetWidth, height: element.offsetHeight, scaleX: bounds.width / desktop.offsetWidth, scaleY: bounds.height / desktop.offsetHeight, edge };
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function resize(element: HTMLElement, start: WindowRect, edge: ResizeEdge, dx: number, dy: number) {
    const desktop = element.parentElement!;
    dispatch({ type: "resize", id: window.id, ...resizeWindowBounds(start, edge, dx, dy, desktop.clientWidth, desktop.clientHeight) });
  }

  function dragWindow(event: PointerEvent<HTMLElement>) {
    const start = drag.current;
    if (!start || start.pointer !== event.pointerId) return;
    const dx = (event.clientX - start.startX) / start.scaleX;
    const dy = (event.clientY - start.startY) / start.scaleY;
    if (start.edge === "move") move(event.currentTarget.parentElement!, start.x + dx, start.y + dy);
    else resize(event.currentTarget.parentElement!, start, start.edge, dx, dy);
  }

  function endDrag(event: PointerEvent<HTMLElement>) {
    if (drag.current?.pointer !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function moveWithKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || window.maximized || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const element = event.currentTarget.parentElement!;
    const step = event.shiftKey ? 32 : 12;
    move(element, element.offsetLeft + (event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0), element.offsetTop + (event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0));
  }

  function resizeWithKeys(event: KeyboardEvent<HTMLButtonElement>, edge: ResizeEdge) {
    if (window.maximized) return;
    const dx = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
    const dy = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
    if ((!dx || (!edge.includes("e") && !edge.includes("w"))) && (!dy || (!edge.includes("n") && !edge.includes("s")))) return;
    event.preventDefault();
    const element = event.currentTarget.parentElement!;
    const step = event.shiftKey ? 32 : 12;
    resize(element, { x: element.offsetLeft, y: element.offsetTop, width: element.offsetWidth, height: element.offsetHeight }, edge, dx * step, dy * step);
  }

  return (
    <section data-window={window.id} data-active={active} hidden={window.minimized} className={`computer-window ${window.maximized ? "computer-window-maximized" : ""}`} style={{ "--window-x": `${window.x}px`, "--window-y": `${window.y}px`, "--window-saved-width": window.width === null ? undefined : `${window.width}px`, "--window-saved-height": window.height === null ? undefined : `${window.height}px`, zIndex } as CSSProperties} role="dialog" aria-label={`${title} window`} onPointerDownCapture={() => dispatch({ type: "activate", id: window.id })} onFocusCapture={() => dispatch({ type: "activate", id: window.id })}>
      <div className="computer-window-bar" tabIndex={0} aria-label={`Move ${title} window`} aria-describedby={helpId} onKeyDown={moveWithKeys} onPointerDown={startDrag} onPointerMove={dragWindow} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={() => { drag.current = null; }} onDoubleClick={(event) => { if (!(event.target as Element).closest("button")) dispatch({ type: "maximize", id: window.id }); }}>
        <span><Folder size={14} /> {title}</span>
        <div className="computer-window-controls">
          <button onClick={() => dispatch({ type: "minimize", id: window.id })} aria-label={`Minimize ${title} window`} title="Minimize"><Minus size={14} /></button>
          <button onClick={() => dispatch({ type: "maximize", id: window.id })} aria-label={`${window.maximized ? "Restore" : "Maximize"} ${title} window${window.maximized ? " size" : ""}`} title={window.maximized ? "Restore" : "Maximize"}>{window.maximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}</button>
          <button onClick={() => dispatch({ type: "close", id: window.id })} aria-label={`Close ${title} window`} title="Close"><X size={16} /></button>
        </div>
      </div>
      <span id={helpId} className="sr-only">Drag the title bar, or focus it and use the arrow keys to move this window. Double-click the title bar to maximize or restore it.</span>
      <div className="computer-window-toolbar"><button onClick={() => dispatch({ type: "showDesktop" })}><Monitor size={13} /> Desktop</button><span>/</span><span>{window.id}</span></div>
      {children}
      <div className="computer-window-status">{status}</div>
      <span id={resizeHelpId} className="sr-only">Drag an edge or corner to resize. Use arrow keys when a resize handle is focused; hold Shift for larger steps.</span>
      {!window.maximized && resizeEdges.map(({ edge, label }) => <button key={edge} className={`computer-resize-handle computer-resize-${edge}`} tabIndex={edge === "se" ? 0 : -1} aria-label={`Resize ${title} window from ${label}`} aria-describedby={resizeHelpId} onPointerDown={(event) => startDrag(event, edge)} onPointerMove={dragWindow} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={() => { drag.current = null; }} onKeyDown={(event) => resizeWithKeys(event, edge)} />)}
    </section>
  );
}
