export type ApplicationId = "projects" | "experience" | "skills" | "about" | "contact";
export type ScreenPage = ApplicationId | "home";

export type DesktopWindowState = {
  id: ApplicationId;
  x: number;
  y: number;
  width: number | null;
  height: number | null;
  minimized: boolean;
  maximized: boolean;
  project: number | null;
};

export type DesktopState = {
  windows: DesktopWindowState[];
  active: ApplicationId | null;
};

export type DesktopAction =
  | { type: "open" | "activate" | "close" | "minimize" | "maximize"; id: ApplicationId }
  | { type: "move"; id: ApplicationId; x: number; y: number }
  | { type: "resize"; id: ApplicationId; x: number; y: number; width: number; height: number }
  | { type: "project"; project: number | null }
  | { type: "showDesktop" }
  | { type: "escape" };

export const initialDesktop: DesktopState = { windows: [], active: null };

function frontmost(windows: DesktopWindowState[]) {
  return windows.filter((window) => !window.minimized).at(-1)?.id ?? null;
}

export function desktopReducer(state: DesktopState, action: DesktopAction): DesktopState {
  if (action.type === "showDesktop") {
    return { windows: state.windows.map((window) => ({ ...window, minimized: true })), active: null };
  }
  if (action.type === "escape") {
    const active = state.windows.find((window) => window.id === state.active);
    if (!active) return state;
    return desktopReducer(state, active.id === "projects" && active.project !== null
      ? { type: "project", project: null }
      : { type: "close", id: active.id });
  }
  if (action.type === "project") {
    return { ...state, windows: state.windows.map((window) => window.id === "projects" ? { ...window, project: action.project } : window) };
  }
  const current = state.windows.find((window) => window.id === action.id);
  if (action.type === "open" || action.type === "activate") {
    if (action.type === "activate" && (!current || state.active === action.id)) return state;
    const window = current ?? { id: action.id, x: 124 + state.windows.length * 19, y: 17 + state.windows.length * 19, width: null, height: null, minimized: false, maximized: false, project: null };
    return { windows: [...state.windows.filter((item) => item.id !== action.id), { ...window, minimized: false }], active: action.id };
  }
  if (!current) return state;
  if (action.type === "resize") {
    if (current.maximized) return state;
    return { ...state, windows: state.windows.map((window) => window.id === action.id ? { ...window, x: action.x, y: action.y, width: action.width, height: action.height } : window) };
  }
  if (action.type === "close" || action.type === "minimize") {
    const windows = action.type === "close"
      ? state.windows.filter((window) => window.id !== action.id)
      : state.windows.map((window) => window.id === action.id ? { ...window, minimized: true } : window);
    return { windows, active: state.active === action.id ? frontmost(windows) : state.active };
  }
  return { ...state, windows: state.windows.map((window) => window.id !== action.id ? window : action.type === "move"
    ? { ...window, x: action.x, y: action.y }
    : { ...window, maximized: !window.maximized }) };
}

export function boundWindowPosition(x: number, y: number, desktopWidth: number, desktopHeight: number, windowWidth: number, windowHeight: number) {
  return {
    x: Math.max(0, Math.min(x, Math.max(0, desktopWidth - windowWidth))),
    y: Math.max(0, Math.min(y, Math.max(0, desktopHeight - windowHeight))),
  };
}

export type ResizeEdge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
export type WindowRect = { x: number; y: number; width: number; height: number };

export function resizeWindowBounds(start: WindowRect, edge: ResizeEdge, dx: number, dy: number, desktopWidth: number, desktopHeight: number): WindowRect {
  const minWidth = Math.min(280, desktopWidth);
  const minHeight = Math.min(220, desktopHeight);
  let left = start.x, right = start.x + start.width;
  let top = start.y, bottom = start.y + start.height;
  if (edge.includes("w")) left = Math.max(0, Math.min(start.x + dx, right - minWidth));
  if (edge.includes("e")) right = Math.min(desktopWidth, Math.max(right + dx, left + minWidth));
  if (edge.includes("n")) top = Math.max(0, Math.min(start.y + dy, bottom - minHeight));
  if (edge.includes("s")) bottom = Math.min(desktopHeight, Math.max(bottom + dy, top + minHeight));
  return { x: left, y: top, width: right - left, height: bottom - top };
}
