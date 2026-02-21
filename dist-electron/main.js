var Se = Object.defineProperty;
var Ee = (i, t, o) => t in i ? Se(i, t, { enumerable: !0, configurable: !0, writable: !0, value: o }) : i[t] = o;
var S = (i, t, o) => Ee(i, typeof t != "symbol" ? t + "" : t, o);
import { ipcMain as m, screen as N, BrowserWindow as L, app as D, desktopCapturer as ve, shell as me, dialog as ie, nativeImage as Te, session as _e, Tray as Ce, Menu as Ae } from "electron";
import { fileURLToPath as de } from "node:url";
import d from "node:path";
import k from "node:fs/promises";
import K from "node:fs";
import { spawnSync as Re, spawn as be } from "node:child_process";
import { createRequire as Ne } from "node:module";
const ee = d.dirname(de(import.meta.url)), je = d.join(ee, ".."), U = process.env.VITE_DEV_SERVER_URL, re = d.join(je, "dist");
let G = null, I = null;
m.on("hud-overlay-hide", () => {
  G && !G.isDestroyed() && G.minimize(), I && !I.isDestroyed() && I.minimize();
});
function xe() {
  const i = N.getPrimaryDisplay(), { workArea: t } = i, o = 500, c = 120, l = Math.floor(t.x + (t.width - o) / 2), a = Math.floor(t.y + t.height - c - 5), p = new L({
    width: o,
    height: c,
    minWidth: 500,
    maxWidth: 1400,
    minHeight: 100,
    maxHeight: 720,
    x: l,
    y: a,
    frame: !1,
    thickFrame: !1,
    transparent: !0,
    resizable: !1,
    alwaysOnTop: !0,
    skipTaskbar: !0,
    hasShadow: !1,
    webPreferences: {
      preload: d.join(ee, "preload.mjs"),
      nodeIntegration: !1,
      contextIsolation: !0,
      backgroundThrottling: !1
    }
  });
  return p.setContentProtection(!0), p.webContents.on("did-finish-load", () => {
    p == null || p.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), G = p, p.on("closed", () => {
    G === p && (G = null);
  }), p.on("minimize", () => {
    I && !I.isDestroyed() && I.minimize();
  }), U ? p.loadURL(U + "?windowType=hud-overlay") : p.loadFile(d.join(re, "index.html"), {
    query: { windowType: "hud-overlay" }
  }), p;
}
function We() {
  const i = process.platform === "darwin", t = new L({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    ...i && {
      titleBarStyle: "hiddenInset",
      trafficLightPosition: { x: 12, y: 12 }
    },
    transparent: !1,
    resizable: !0,
    alwaysOnTop: !1,
    skipTaskbar: !1,
    title: "velocity",
    backgroundColor: "#000000",
    webPreferences: {
      preload: d.join(ee, "preload.mjs"),
      nodeIntegration: !1,
      contextIsolation: !0,
      webSecurity: !1,
      backgroundThrottling: !1
    }
  });
  return t.maximize(), t.webContents.on("did-finish-load", () => {
    t == null || t.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), U ? t.loadURL(U + "?windowType=editor") : t.loadFile(d.join(re, "index.html"), {
    query: { windowType: "editor" }
  }), t;
}
function Ve() {
  const { width: i, height: t } = N.getPrimaryDisplay().workAreaSize, o = new L({
    width: 620,
    height: 420,
    minHeight: 350,
    maxHeight: 500,
    x: Math.round((i - 620) / 2),
    y: Math.round((t - 420) / 2),
    frame: !1,
    thickFrame: !1,
    resizable: !1,
    alwaysOnTop: !0,
    transparent: !0,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: d.join(ee, "preload.mjs"),
      nodeIntegration: !1,
      contextIsolation: !0
    }
  });
  return o.setContentProtection(!0), U ? o.loadURL(U + "?windowType=source-selector") : o.loadFile(d.join(re, "index.html"), {
    query: { windowType: "source-selector" }
  }), o;
}
function Oe(i) {
  if (I && !I.isDestroyed())
    return I.focus(), I;
  const t = N.getPrimaryDisplay(), { workArea: o } = t, c = 320, l = 200, a = Math.floor(o.x + o.width - c - 24), p = Math.floor(o.y + o.height - l - 140), w = new L({
    width: c,
    height: l,
    minWidth: 220,
    minHeight: 140,
    x: a,
    y: p,
    frame: !1,
    thickFrame: !1,
    transparent: !0,
    resizable: !0,
    alwaysOnTop: !0,
    skipTaskbar: !0,
    hasShadow: !1,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: d.join(ee, "preload.mjs"),
      nodeIntegration: !1,
      contextIsolation: !0,
      backgroundThrottling: !1
    }
  });
  w.setContentProtection(!0), w.setVisibleOnAllWorkspaces(!0, { visibleOnFullScreen: !0 }), w.setAspectRatio(16 / 9);
  const h = { windowType: "camera-preview", ...i ? { deviceId: i } : {} };
  if (U) {
    const x = new URL(U);
    x.searchParams.set("windowType", "camera-preview"), i && x.searchParams.set("deviceId", i), w.loadURL(x.toString());
  } else
    w.loadFile(d.join(re, "index.html"), { query: h });
  return I = w, w.on("closed", () => {
    I === w && (I = null);
  }), w;
}
function le() {
  I && !I.isDestroyed() && I.close(), I = null;
}
function ze() {
  return I && !I.isDestroyed() ? I : null;
}
class Le {
  constructor() {
    S(this, "hook", null);
    S(this, "handlers", []);
  }
  start(t) {
    const o = Ne(import.meta.url);
    let c;
    try {
      c = o("uiohook-napi");
    } catch {
      return { success: !1, message: "uiohook-napi is not installed" };
    }
    const l = (c == null ? void 0 : c.uIOhook) ?? (c == null ? void 0 : c.default) ?? c;
    if (!l || typeof l.on != "function" || typeof l.start != "function" || typeof l.stop != "function")
      return { success: !1, message: "uiohook-napi loaded, but API shape is unsupported" };
    this.hook = l, this.handlers = [
      { name: "mousedown", cb: (a) => t.onMouseDown(a) },
      { name: "mouseup", cb: (a) => t.onMouseUp(a) },
      { name: "mousemove", cb: (a) => t.onMouseMove(a) },
      { name: "wheel", cb: (a) => t.onWheel(a) },
      { name: "keydown", cb: (a) => t.onKeyDown(a) }
    ];
    try {
      for (const a of this.handlers)
        this.hook.on(a.name, a.cb);
      return this.hook.start(), { success: !0 };
    } catch (a) {
      return this.stop(), { success: !1, message: `Failed to start native hook: ${String(a)}` };
    }
  }
  stop() {
    var t, o;
    if (this.hook)
      try {
        for (const c of this.handlers)
          typeof ((t = this.hook) == null ? void 0 : t.off) == "function" ? this.hook.off(c.name, c.cb) : typeof ((o = this.hook) == null ? void 0 : o.removeListener) == "function" && this.hook.removeListener(c.name, c.cb);
        this.hook.stop(), typeof this.hook.removeAllListeners == "function" && this.hook.removeAllListeners();
      } catch {
      } finally {
        this.handlers = [], this.hook = null;
      }
  }
}
function te() {
  return {
    totalEvents: 0,
    mouseDownCount: 0,
    mouseUpCount: 0,
    mouseMoveCount: 0,
    wheelCount: 0,
    keyDownCount: 0
  };
}
function Ue(i, t) {
  switch (i.totalEvents += 1, t.type) {
    case "mouseDown":
      i.mouseDownCount += 1;
      break;
    case "mouseUp":
      i.mouseUpCount += 1;
      break;
    case "mouseMoveSampled":
      i.mouseMoveCount += 1;
      break;
    case "wheel":
      i.wheelCount += 1;
      break;
    case "keyDownCategory":
      i.keyDownCount += 1;
      break;
  }
}
function Be(i) {
  return i ? i.startsWith("screen:") ? "screen" : i.startsWith("window:") ? "window" : "unknown" : "unknown";
}
function $e(i, t) {
  if (i !== "screen")
    return;
  const l = N.getAllDisplays().find((j) => String(j.id) === t) ?? N.getPrimaryDisplay(), { x: a, y: p, width: w, height: h } = l.bounds, x = (j) => {
    const z = N.dipToScreenPoint;
    return typeof z == "function" ? z(j) : j;
  }, F = x({ x: a, y: p }), A = x({ x: a + w, y: p + h }), H = Math.max(1, A.x - F.x), B = Math.max(1, A.y - F.y);
  return {
    x: F.x,
    y: F.y,
    width: H,
    height: B
  };
}
function He(i) {
  if (i.ctrlKey || i.altKey || i.metaKey) return "shortcut";
  const t = i.keycode ?? i.rawcode ?? -1;
  return t === 14 || t === 8 ? "backspace" : t === 15 || t === 9 ? "tab" : t === 28 || t === 13 ? "enter" : [29, 42, 54, 56, 3613, 3675].includes(t) ? "modifier" : t >= 2 && t <= 13 || t >= 16 && t <= 27 || t >= 30 && t <= 53 ? "printable" : "other";
}
function ae(i, t) {
  return t === "mouseDown" || t === "mouseUp" ? i.button === 2 ? "default" : "pointer" : t === "wheel" ? Math.abs(Number(i.deltaX ?? 0)) + Math.abs(Number(i.deltaY ?? 0)) > 0 ? "default" : "pointer" : "default";
}
class qe {
  constructor() {
    S(this, "provider", new Le());
    S(this, "events", []);
    S(this, "stats", te());
    S(this, "currentSession", null);
    S(this, "lastMoveTs", 0);
    S(this, "lastMoveX", -1);
    S(this, "lastMoveY", -1);
  }
  start(t, o) {
    this.stop();
    const c = t.sourceId ?? (o == null ? void 0 : o.id), l = t.sourceDisplayId ?? (o == null ? void 0 : o.display_id), a = Be(c), p = $e(a, l);
    this.currentSession = {
      sessionId: t.sessionId,
      startedAtMs: t.startedAtMs,
      sourceKind: a,
      sourceId: c,
      sourceDisplayId: l,
      sourceBounds: p
    }, this.events = [], this.stats = te(), this.lastMoveTs = 0, this.lastMoveX = -1, this.lastMoveY = -1;
    const w = this.provider.start({
      onMouseDown: (h) => {
        this.pushEvent({
          type: "mouseDown",
          ts: Date.now(),
          x: Number(h.x ?? 0),
          y: Number(h.y ?? 0),
          button: Number(h.button ?? 0),
          cursorType: ae(h, "mouseDown")
        });
      },
      onMouseUp: (h) => {
        this.pushEvent({
          type: "mouseUp",
          ts: Date.now(),
          x: Number(h.x ?? 0),
          y: Number(h.y ?? 0),
          button: Number(h.button ?? 0),
          cursorType: ae(h, "mouseUp")
        });
      },
      onMouseMove: (h) => {
        const x = Date.now(), F = Number(h.x ?? 0), A = Number(h.y ?? 0), H = 33, B = 4, j = F - this.lastMoveX, z = A - this.lastMoveY, q = j * j + z * z;
        x - this.lastMoveTs < H && q < B * B || (this.lastMoveTs = x, this.lastMoveX = F, this.lastMoveY = A, this.pushEvent({
          type: "mouseMoveSampled",
          ts: x,
          x: F,
          y: A,
          cursorType: "default"
        }));
      },
      onWheel: (h) => {
        const x = Number(h.deltaY ?? h.amount ?? h.rotation ?? 0), F = Number(h.deltaX ?? 0);
        this.pushEvent({
          type: "wheel",
          ts: Date.now(),
          x: Number(h.x ?? 0),
          y: Number(h.y ?? 0),
          deltaX: F,
          deltaY: x,
          cursorType: ae({ deltaX: F, deltaY: x }, "wheel")
        });
      },
      onKeyDown: (h) => {
        this.pushEvent({
          type: "keyDownCategory",
          ts: Date.now(),
          category: He(h)
        });
      }
    });
    return w.success || (this.currentSession = null, this.events = [], this.stats = te()), w;
  }
  stop() {
    if (this.provider.stop(), !this.currentSession)
      return null;
    const t = {
      version: 1,
      sessionId: this.currentSession.sessionId,
      startedAtMs: this.currentSession.startedAtMs,
      sourceKind: this.currentSession.sourceKind,
      sourceId: this.currentSession.sourceId,
      sourceDisplayId: this.currentSession.sourceDisplayId,
      sourceBounds: this.currentSession.sourceBounds,
      events: this.events,
      stats: this.stats
    };
    return this.currentSession = null, this.events = [], this.stats = te(), t;
  }
  pushEvent(t) {
    this.events.push(t), Ue(this.stats, t);
  }
}
class Xe {
  constructor() {
    S(this, "process", null);
    S(this, "buffer", "");
    S(this, "pending", /* @__PURE__ */ new Map());
    S(this, "status", "idle");
    S(this, "statusMessage", "");
    S(this, "currentSessionId", null);
    S(this, "startedAtMs", null);
    S(this, "sequence", 0);
  }
  async start(t) {
    if (this.status === "recording" || this.status === "starting")
      return { success: !1, message: "Native capture already in progress" };
    const o = await this.ensureProcess();
    if (!o.success)
      return o;
    this.status = "starting", this.statusMessage = "", this.currentSessionId = t.sessionId, this.startedAtMs = Date.now();
    try {
      const c = await this.sendRequest({
        id: this.nextId("start"),
        cmd: "start_capture",
        payload: t
      }, 1e4);
      return c.ok ? (this.status = "recording", this.statusMessage = "", { success: !0 }) : (this.status = "error", this.statusMessage = c.error || "Failed to start native capture", { success: !1, message: this.statusMessage });
    } catch (c) {
      return this.status = "error", this.statusMessage = c instanceof Error ? c.message : "Failed to start native capture", { success: !1, message: this.statusMessage };
    }
  }
  async stop(t) {
    var o, c, l, a, p, w;
    if (this.status !== "recording" && this.status !== "starting")
      return { success: !1, message: "Native capture is not active" };
    if (!this.process)
      return this.status = "idle", { success: !1, message: "Native capture process not available" };
    this.status = "stopping";
    try {
      const h = await this.sendRequest({
        id: this.nextId("stop"),
        cmd: "stop_capture",
        payload: t
      }, 2e4);
      if (!h.ok)
        return this.status = "error", this.statusMessage = h.error || "Failed to stop native capture", { success: !1, message: this.statusMessage };
      const x = typeof ((o = h.payload) == null ? void 0 : o.outputPath) == "string" ? h.payload.outputPath : "";
      if (!x)
        return this.status = "error", this.statusMessage = "Native capture did not return output path", { success: !1, message: this.statusMessage };
      const F = K.existsSync(x) ? K.statSync(x) : void 0, A = {
        outputPath: x,
        durationMs: Q((c = h.payload) == null ? void 0 : c.durationMs),
        width: Q((l = h.payload) == null ? void 0 : l.width),
        height: Q((a = h.payload) == null ? void 0 : a.height),
        fpsActual: Q((p = h.payload) == null ? void 0 : p.fpsActual),
        bytes: Q((w = h.payload) == null ? void 0 : w.bytes) ?? (F == null ? void 0 : F.size)
      };
      return this.status = "idle", this.statusMessage = "", this.currentSessionId = null, this.startedAtMs = null, { success: !0, result: A };
    } catch (h) {
      return this.status = "error", this.statusMessage = h instanceof Error ? h.message : "Failed to stop native capture", { success: !1, message: this.statusMessage };
    }
  }
  async getEncoderOptions(t) {
    var l;
    const o = this.getEncoderOptionsFromFfmpeg(t), c = await this.ensureProcess();
    if (!c.success)
      return {
        success: o.success,
        options: o.options,
        message: c.message || o.message
      };
    try {
      const a = await this.sendRequest({
        id: this.nextId("get-encoder-options"),
        cmd: "get_encoder_options",
        payload: {
          platform: process.platform,
          ...t ? { ffmpegPath: t } : {}
        }
      }, 5e3);
      if (!a.ok)
        return o.options.length > 1 ? {
          success: !0,
          options: o.options,
          message: a.error || o.message || "Sidecar encoder options unavailable, used FFmpeg probe fallback"
        } : {
          success: !1,
          options: o.options,
          message: a.error || "Failed to fetch encoder options"
        };
      const w = (Array.isArray((l = a.payload) == null ? void 0 : l.options) ? a.payload.options : []).filter((h) => !!h && typeof h == "object" && typeof h.codec == "string" && typeof h.label == "string" && typeof h.hardware == "string").map((h) => ({
        encoder: h.codec,
        label: h.label,
        hardware: h.hardware
      }));
      return w.some((h) => h.encoder === "h264_libx264") || w.unshift({ encoder: "h264_libx264", label: "x264 (CPU)", hardware: "cpu" }), { success: !0, options: w };
    } catch (a) {
      return o.options.length > 1 ? {
        success: !0,
        options: o.options,
        message: a instanceof Error ? a.message : o.message
      } : {
        success: !1,
        options: o.options,
        message: a instanceof Error ? a.message : "Failed to fetch encoder options"
      };
    }
  }
  getEncoderOptionsFromFfmpeg(t) {
    const o = [
      { encoder: "h264_libx264", label: "x264 (CPU)", hardware: "cpu" }
    ], c = t || (process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"), l = Re(c, ["-hide_banner", "-encoders"], {
      encoding: "utf8",
      windowsHide: !0,
      timeout: 4e3
    }), a = `${l.stdout || ""}
${l.stderr || ""}`;
    return l.error || !a.trim() ? {
      success: !1,
      options: o,
      message: l.error instanceof Error ? l.error.message : "Unable to probe FFmpeg encoders"
    } : (a.includes("h264_nvenc") && o.push({ encoder: "h264_nvenc", label: "NVIDIA H264 (GPU)", hardware: "nvidia" }), a.includes("h264_amf") && o.push({ encoder: "h264_amf", label: "AMD H264", hardware: "amd" }), { success: !0, options: o });
  }
  getStatus(t) {
    return {
      status: this.status,
      message: this.statusMessage || void 0,
      sessionId: t || this.currentSessionId || void 0,
      startedAtMs: this.startedAtMs || void 0
    };
  }
  dispose() {
    for (const [, t] of this.pending.entries())
      clearTimeout(t.timeout), t.reject(new Error("Native capture service disposed"));
    this.pending.clear(), this.process && !this.process.killed && this.process.kill(), this.process = null, this.buffer = "", this.status = "idle", this.statusMessage = "", this.currentSessionId = null, this.startedAtMs = null;
  }
  async ensureProcess() {
    if (this.process && !this.process.killed)
      return { success: !0 };
    const t = Ye();
    if (!t)
      return { success: !1, message: "Native capture sidecar not found. Build sidecar binaries first." };
    const o = be(t, [], {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: !0
    });
    this.process = o, this.buffer = "", o.stdout.setEncoding("utf8"), o.stdout.on("data", (c) => {
      this.consumeStdout(c);
    }), o.stderr.setEncoding("utf8"), o.stderr.on("data", () => {
    }), o.on("exit", (c, l) => {
      const a = `Native capture sidecar exited (code=${c ?? "null"}, signal=${l ?? "null"})`;
      for (const [, p] of this.pending.entries())
        clearTimeout(p.timeout), p.reject(new Error(a));
      this.pending.clear(), this.process = null, this.status !== "idle" && (this.status = "error", this.statusMessage = a);
    });
    try {
      const c = await this.sendRequest({
        id: this.nextId("init"),
        cmd: "init",
        payload: { platform: process.platform }
      }, 5e3);
      return c.ok ? { success: !0 } : (this.status = "error", this.statusMessage = c.error || "Native capture sidecar init failed", { success: !1, message: this.statusMessage });
    } catch (c) {
      return this.status = "error", this.statusMessage = c instanceof Error ? c.message : "Native capture init failed", { success: !1, message: this.statusMessage };
    }
  }
  consumeStdout(t) {
    this.buffer += t;
    const o = this.buffer.split(/\r?\n/);
    this.buffer = o.pop() ?? "";
    for (const c of o) {
      const l = c.trim();
      if (!l) continue;
      let a;
      try {
        a = JSON.parse(l);
      } catch {
        continue;
      }
      if (a.id) {
        const p = this.pending.get(a.id);
        if (p) {
          clearTimeout(p.timeout), this.pending.delete(a.id), p.resolve(a);
          continue;
        }
      }
      a.event === "capture_error" && (this.status = "error", this.statusMessage = a.error || "Native capture sidecar reported error");
    }
  }
  async sendRequest(t, o) {
    if (!this.process || this.process.killed)
      throw new Error("Native capture process is not running");
    const c = `${JSON.stringify(t)}
`, l = new Promise((a, p) => {
      const w = setTimeout(() => {
        this.pending.delete(t.id), p(new Error(`Native capture request timed out (${t.cmd})`));
      }, o);
      this.pending.set(t.id, { resolve: a, reject: p, timeout: w });
    });
    return this.process.stdin.write(c), await l;
  }
  nextId(t) {
    return this.sequence += 1, `${t}-${Date.now()}-${this.sequence}`;
  }
}
function Ye() {
  const i = process.platform === "win32" ? "native-capture-sidecar.exe" : "native-capture-sidecar", t = D.isPackaged ? [
    d.join(process.resourcesPath, "native-capture", process.platform, i),
    d.join(process.resourcesPath, "native-capture", i)
  ] : [
    d.join(D.getAppPath(), "native-capture-sidecar", "bin", process.platform, i),
    d.join(D.getAppPath(), "native-capture-sidecar", "target", "debug", i),
    d.join(D.getAppPath(), "native-capture-sidecar", "target", "release", i)
  ];
  for (const o of t)
    if (K.existsSync(o))
      return o;
  return null;
}
function Q(i) {
  return typeof i == "number" && Number.isFinite(i) ? i : void 0;
}
const Ke = d.dirname(de(import.meta.url));
let P = null, V = null, M = null;
const ge = new qe(), se = new Xe(), ce = d.join(D.getPath("documents"), "velocity exports"), b = {
  micEnabled: !0,
  selectedMicDeviceId: "",
  micProcessingMode: "cleaned",
  cameraEnabled: !1,
  cameraPreviewEnabled: !0,
  selectedCameraDeviceId: "",
  recordingPreset: "quality",
  recordingFps: 60,
  customCursorEnabled: !0,
  useLegacyRecorder: !1,
  recordingEncoder: "h264_libx264",
  encoderOptions: [
    { encoder: "h264_libx264", label: "x264 (CPU)", hardware: "cpu" }
  ]
};
function Ge(i) {
  if (!i) return;
  const o = N.getAllDisplays().find((p) => String(p.id) === i);
  if (!o) return;
  const c = (p) => {
    const w = N.dipToScreenPoint;
    return typeof w == "function" ? w(p) : p;
  }, l = c({ x: o.bounds.x, y: o.bounds.y }), a = c({
    x: o.bounds.x + o.bounds.width,
    y: o.bounds.y + o.bounds.height
  });
  return {
    x: l.x,
    y: l.y,
    width: Math.max(1, a.x - l.x),
    height: Math.max(1, a.y - l.y)
  };
}
function Je() {
  return !P || typeof P != "object" ? null : {
    id: typeof P.id == "string" ? P.id : void 0,
    display_id: typeof P.display_id == "string" ? P.display_id : void 0
  };
}
let X = null, Y = null;
const Z = {};
function Qe(i) {
  const t = d.parse(i);
  return d.join(t.dir, `${t.name}.telemetry.json`);
}
async function Ze(i) {
  var o;
  const t = Qe(i);
  try {
    const c = await k.readFile(t, "utf-8"), l = JSON.parse(c);
    if (l && l.version === 1 && Array.isArray(l.events))
      return console.info("[auto-zoom][main] Telemetry sidecar loaded", {
        telemetryPath: t,
        sessionId: l.sessionId,
        totalEvents: ((o = l.stats) == null ? void 0 : o.totalEvents) ?? 0
      }), { path: t, telemetry: l };
    console.warn("[auto-zoom][main] Telemetry sidecar was present but invalid format", {
      telemetryPath: t
    });
  } catch {
    console.info("[auto-zoom][main] No telemetry sidecar found for video", {
      videoPath: i,
      telemetryPath: t
    });
  }
  return null;
}
function et(i, t, o, c, l, a, p, w, h) {
  const x = (r) => r === "recording" ? X : Y, F = (r, e) => {
    if (r === "recording") {
      X = e, e || delete Z.recording;
      return;
    }
    Y = e, e || delete Z.media;
  }, A = () => {
    const r = [X, Y];
    for (const e of r)
      e && !e.isDestroyed() && e.close();
    X = null, Y = null, delete Z.recording, delete Z.media;
  }, H = (r, e, s, n) => {
    const u = e === "recording" ? { width: 420, height: 560 } : { width: 360, height: 290 }, f = 8, g = {
      x: r.x + s.x,
      y: r.y + s.y,
      width: s.width,
      height: s.height
    }, E = N.getDisplayMatching(r).workArea, W = g.x + Math.round((g.width - u.width) / 2), C = E.x + E.width - u.width, T = Math.max(E.x, Math.min(W, C)), R = n === "top" ? g.y - u.height - f : g.y + g.height + f, ke = E.y + E.height - u.height, Fe = Math.max(E.y, Math.min(R, ke));
    return { x: T, y: Fe, width: u.width, height: u.height };
  }, B = () => {
    L.getAllWindows().forEach((r) => {
      r.isDestroyed() || r.webContents.send("hud-settings-updated", b);
    });
  }, j = (r, e) => {
    const s = new L({
      width: e.width,
      height: e.height,
      resizable: !1,
      frame: !1,
      transparent: !0,
      show: !1,
      hasShadow: !1,
      alwaysOnTop: !0,
      skipTaskbar: !0,
      x: e.x,
      y: e.y,
      webPreferences: {
        preload: d.join(Ke, "preload.mjs"),
        nodeIntegration: !1,
        contextIsolation: !0,
        backgroundThrottling: !1
      }
    });
    if (s.on("closed", () => {
      F(r, null);
    }), ue) {
      const n = new URL(ue);
      n.searchParams.set("windowType", "hud-popover"), n.searchParams.set("kind", r), s.loadURL(n.toString());
    } else
      s.loadFile(d.join(pe, "index.html"), {
        query: { windowType: "hud-popover", kind: r }
      });
    return F(r, s), s;
  }, z = (r, e, s) => {
    const n = a();
    if (!n || n.isDestroyed())
      return { success: !1, message: "HUD window unavailable" };
    Z[r] = { anchorRect: e, side: s };
    const u = H(n.getBounds(), r, e, s), f = x(r);
    if (f && !f.isDestroyed()) {
      f.setBounds(u, !1);
      const y = () => {
        f.isDestroyed() || (f.isVisible() || f.show(), f.webContents.send("hud-settings-updated", b));
      };
      return f.webContents.isLoadingMainFrame() ? f.webContents.once("did-finish-load", y) : y(), { success: !0 };
    }
    const g = j(r, u);
    return g.webContents.once("did-finish-load", () => {
      g.isDestroyed() || (g.webContents.send("hud-settings-updated", b), g.show());
    }), { success: !0 };
  }, q = async (r) => {
    await k.mkdir(r, { recursive: !0 });
  }, ne = () => D.isPackaged ? d.join(process.resourcesPath, "native-capture", process.platform, process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg") : d.join(D.getAppPath(), "native-capture-sidecar", "bin", process.platform, process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"), Ie = async (r, e, s = 0) => {
    const n = ne();
    if (!K.existsSync(n))
      return { success: !1, message: "ffmpeg executable not found for native audio muxing" };
    const u = d.parse(r), f = d.join(u.dir, `${u.name}.with-audio${u.ext || ".mp4"}`), g = [
      "-y",
      "-i",
      r
    ], y = Math.abs(s) / 1e3;
    s > 0 && y > 1e-3 ? g.push("-itsoffset", y.toFixed(3)) : s < 0 && y > 1e-3 && g.push("-ss", y.toFixed(3)), g.push(
      "-i",
      e,
      "-map",
      "0:v:0",
      "-map",
      "1:a:0",
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-shortest",
      f
    );
    const E = await new Promise((W) => {
      const C = be(n, g, { windowsHide: !0, stdio: ["ignore", "pipe", "pipe"] });
      let T = "";
      C.stderr.setEncoding("utf8"), C.stderr.on("data", (R) => {
        T.length < 4e3 && (T += String(R));
      }), C.on("error", (R) => {
        W({ success: !1, message: `ffmpeg failed to start: ${String(R)}` });
      }), C.on("close", (R) => {
        if (R === 0) {
          W({ success: !0 });
          return;
        }
        W({
          success: !1,
          message: `ffmpeg mux failed with exit code ${String(R)}${T ? `: ${T.trim()}` : ""}`
        });
      });
    });
    if (!E.success)
      return await J(f), { success: !1, message: E.message };
    try {
      await k.unlink(r);
    } catch {
    }
    return await k.rename(f, r), { success: !0, outputPath: r };
  }, fe = async (r, e) => {
    const s = d.parse(e);
    let n = d.join(r, e), u = 1;
    for (; ; )
      try {
        await k.access(n), n = d.join(r, `${s.name} (${u})${s.ext}`), u += 1;
      } catch {
        return n;
      }
  }, J = async (r) => {
    if (r)
      try {
        await k.unlink(r), console.info("[editor][main] Deleted recording asset", { filePath: r });
      } catch {
        console.warn("[editor][main] Could not delete recording asset (ignored)", { filePath: r });
      }
  };
  m.handle("get-sources", async (r, e) => (await ve.getSources(e)).map((n) => ({
    id: n.id,
    name: n.name,
    display_id: n.display_id,
    thumbnail: n.thumbnail ? n.thumbnail.toDataURL() : null,
    appIcon: n.appIcon ? n.appIcon.toDataURL() : null
  }))), m.handle("select-source", (r, e) => {
    P = e;
    const s = p();
    return s && s.close(), P;
  }), m.handle("get-selected-source", () => P), m.handle("start-input-tracking", (r, e) => {
    console.info("[auto-zoom][main] start-input-tracking requested", {
      sessionId: e.sessionId,
      sourceId: e.sourceId,
      sourceDisplayId: e.sourceDisplayId,
      selectedSourceId: P == null ? void 0 : P.id,
      selectedSourceDisplayId: P == null ? void 0 : P.display_id
    });
    const s = ge.start(e, P ?? void 0);
    return s.success ? console.info("[auto-zoom][main] Input tracking started", {
      sessionId: e.sessionId
    }) : console.warn("[auto-zoom][main] Input tracking failed to start", {
      sessionId: e.sessionId,
      message: s.message
    }), s;
  }), m.handle("stop-input-tracking", () => {
    const r = ge.stop();
    return r ? (console.info("[auto-zoom][main] Input tracking stopped with telemetry", {
      sessionId: r.sessionId,
      totalEvents: r.stats.totalEvents,
      mouseDownCount: r.stats.mouseDownCount,
      keyDownCount: r.stats.keyDownCount,
      wheelCount: r.stats.wheelCount
    }), { success: !0, telemetry: r }) : (console.warn("[auto-zoom][main] stop-input-tracking called with no active tracking session"), { success: !1, message: "No active input tracking session" });
  }), m.handle("open-source-selector", () => {
    const r = p();
    if (r) {
      r.focus();
      return;
    }
    o();
  }), m.handle("open-camera-preview-window", (r, e) => {
    const s = w();
    return s && s.close(), c(e).focus(), { success: !0 };
  }), m.handle("close-camera-preview-window", () => (l(), { success: !0 })), m.handle("switch-to-editor", () => {
    A();
    const r = a();
    r && r.close(), i();
  }), m.handle("store-recorded-video", async (r, e, s) => {
    try {
      const n = d.join(_, s);
      return await k.writeFile(n, Buffer.from(e)), V = n, M = null, {
        success: !0,
        path: n,
        message: "Video stored successfully"
      };
    } catch (n) {
      return console.error("Failed to store video:", n), {
        success: !1,
        message: "Failed to store video",
        error: String(n)
      };
    }
  }), m.handle("start-new-recording-session", async (r, e) => (!!(e != null && e.replaceCurrentTake) && (e != null && e.session) && (await J(e.session.screenVideoPath), await J(e.session.cameraVideoPath), await J(e.session.inputTelemetryPath)), M = null, V = null, A(), t(), { success: !0 })), m.handle("get-hud-settings", () => ({ success: !0, settings: b })), m.handle("preload-hud-popover-windows", () => {
    const r = a();
    if (!r || r.isDestroyed())
      return { success: !1, message: "HUD window unavailable" };
    const e = r.getBounds(), s = { x: Math.max(16, Math.floor(e.width / 2) - 10), y: Math.max(16, Math.floor(e.height / 2) - 10), width: 20, height: 20 };
    return ["recording", "media"].forEach((n) => {
      const u = x(n);
      if (u && !u.isDestroyed())
        return;
      const f = H(e, n, s, "top");
      j(n, f);
    }), { success: !0 };
  }), m.handle("update-hud-settings", (r, e) => (typeof e.micEnabled == "boolean" && (b.micEnabled = e.micEnabled), typeof e.selectedMicDeviceId == "string" && (b.selectedMicDeviceId = e.selectedMicDeviceId), (e.micProcessingMode === "raw" || e.micProcessingMode === "cleaned") && (b.micProcessingMode = e.micProcessingMode), typeof e.cameraEnabled == "boolean" && (b.cameraEnabled = e.cameraEnabled), typeof e.cameraPreviewEnabled == "boolean" && (b.cameraPreviewEnabled = e.cameraPreviewEnabled), typeof e.selectedCameraDeviceId == "string" && (b.selectedCameraDeviceId = e.selectedCameraDeviceId), (e.recordingPreset === "performance" || e.recordingPreset === "balanced" || e.recordingPreset === "quality") && (b.recordingPreset = e.recordingPreset), (e.recordingFps === 60 || e.recordingFps === 120) && (b.recordingFps = e.recordingFps), typeof e.customCursorEnabled == "boolean" && (b.customCursorEnabled = e.customCursorEnabled, e.customCursorEnabled && (b.useLegacyRecorder = !1)), typeof e.useLegacyRecorder == "boolean" && (b.useLegacyRecorder = e.useLegacyRecorder, e.useLegacyRecorder && (b.customCursorEnabled = !1)), (e.recordingEncoder === "h264_libx264" || e.recordingEncoder === "h264_nvenc" || e.recordingEncoder === "hevc_nvenc" || e.recordingEncoder === "h264_amf") && (b.recordingEncoder = e.recordingEncoder), B(), { success: !0, settings: b })), m.handle("set-hud-encoder-options", (r, e) => {
    var n;
    if (!Array.isArray(e))
      return { success: !1, message: "Invalid encoder options payload" };
    const s = e.filter((u) => !!u && typeof u == "object" && (u.encoder === "h264_libx264" || u.encoder === "h264_nvenc" || u.encoder === "hevc_nvenc" || u.encoder === "h264_amf") && typeof u.label == "string" && (u.hardware === "cpu" || u.hardware === "nvidia" || u.hardware === "amd"));
    return s.some((u) => u.encoder === "h264_libx264") || s.unshift({ encoder: "h264_libx264", label: "x264 (CPU)", hardware: "cpu" }), b.encoderOptions = s, b.encoderOptions.some((u) => u.encoder === b.recordingEncoder) || (b.recordingEncoder = ((n = b.encoderOptions[0]) == null ? void 0 : n.encoder) ?? "h264_libx264"), B(), { success: !0, settings: b };
  }), m.handle("native-capture-encoder-options", async () => {
    const r = ne(), e = K.existsSync(r) ? r : void 0;
    return await se.getEncoderOptions(e);
  }), m.handle("native-capture-start", async (r, e) => {
    var g, y;
    const s = ne(), n = ((g = e.source) == null ? void 0 : g.displayId) || (typeof (P == null ? void 0 : P.display_id) == "string" ? P.display_id : void 0), u = ((y = e.source) == null ? void 0 : y.type) === "screen" ? Ge(n) : void 0, f = {
      ...e,
      outputPath: d.isAbsolute(e.outputPath) ? e.outputPath : d.join(_, e.outputPath),
      ffmpegPath: e.ffmpegPath || (K.existsSync(s) ? s : void 0),
      captureRegion: e.captureRegion || u
    };
    return await se.start(f);
  }), m.handle("native-capture-stop", async (r, e) => await se.stop(e)), m.handle("native-capture-status", (r, e) => ({ success: !0, ...se.getStatus(e) })), m.handle("open-hud-popover-window", (r, e) => e.kind !== "recording" && e.kind !== "media" ? { success: !1, message: "Invalid popover kind" } : z(e.kind, e.anchorRect, e.side)), m.handle("toggle-hud-popover-window", (r, e) => {
    if (e.kind !== "recording" && e.kind !== "media")
      return { success: !1, message: "Invalid popover kind" };
    const s = x(e.kind);
    return s && !s.isDestroyed() && s.isVisible() ? (s.hide(), { success: !0, opened: !1 }) : { ...z(e.kind, e.anchorRect, e.side), opened: !0 };
  }), m.handle("close-hud-popover-window", (r, e) => {
    if (!e)
      return [X, Y].forEach((n) => {
        n && !n.isDestroyed() && n.hide();
      }), { success: !0 };
    const s = x(e);
    return s && !s.isDestroyed() && s.hide(), { success: !0 };
  }), m.handle("close-current-hud-popover-window", (r) => {
    const e = L.fromWebContents(r.sender);
    return !e || e.isDestroyed() ? { success: !1 } : e === X ? (e.hide(), { success: !0 }) : e === Y ? (e.hide(), { success: !0 }) : (e.hide(), { success: !0 });
  }), m.handle("set-hud-overlay-width", (r, e) => {
    const s = a();
    if (!s || s.isDestroyed())
      return { success: !1 };
    const n = Math.max(500, Math.min(1400, Math.round(e))), u = s.getBounds(), g = N.getDisplayMatching(u).workArea, y = u.x + u.width / 2, E = g.x + g.width - n, W = Math.round(y - n / 2), C = Math.max(g.x, Math.min(W, E)), T = g.y + g.height - u.height, R = Math.max(g.y, Math.min(u.y, T));
    return s.setBounds({
      x: C,
      y: R,
      width: n,
      height: u.height
    }, !1), { success: !0 };
  }), m.handle("get-hud-overlay-popover-side", () => {
    const r = a();
    if (!r || r.isDestroyed())
      return { success: !1 };
    const e = r.getBounds(), n = N.getDisplayMatching(e).workArea, u = e.y + e.height / 2, f = n.y + n.height / 2;
    return { success: !0, side: u >= f ? "top" : "bottom" };
  }), m.handle("set-hud-overlay-height", (r, e, s = "bottom") => {
    const n = a();
    if (!n || n.isDestroyed())
      return { success: !1 };
    const u = Math.max(100, Math.min(720, Math.round(e))), f = n.getBounds(), y = N.getDisplayMatching(f).workArea, E = y.x + y.width - f.width, W = y.y + y.height - u, C = Math.max(y.x, Math.min(f.x, E)), T = s === "top" ? f.y : f.y + f.height - u, R = Math.max(y.y, Math.min(T, W));
    return n.setBounds({
      x: C,
      y: R,
      width: f.width,
      height: u
    }, !1), { success: !0 };
  }), m.handle("store-recording-session", async (r, e) => {
    try {
      console.info("[auto-zoom][main] store-recording-session requested", {
        sessionId: typeof e.session.id == "string" ? e.session.id : void 0,
        screenFileName: e.screenFileName,
        hasCameraVideo: !!(e.cameraVideoData && e.cameraFileName),
        hasTelemetry: !!e.inputTelemetry
      });
      const s = d.join(_, e.screenFileName);
      await k.writeFile(s, Buffer.from(e.screenVideoData));
      let n;
      e.cameraVideoData && e.cameraFileName && (n = d.join(_, e.cameraFileName), await k.writeFile(n, Buffer.from(e.cameraVideoData)));
      let u, f;
      if (e.inputTelemetry) {
        const y = e.inputTelemetryFileName || `${d.parse(e.screenFileName).name}.telemetry.json`;
        u = d.join(_, y), await k.writeFile(u, JSON.stringify(e.inputTelemetry), "utf-8"), f = e.inputTelemetry, console.info("[auto-zoom][main] Telemetry sidecar saved", {
          inputTelemetryPath: u,
          sessionId: e.inputTelemetry.sessionId,
          totalEvents: e.inputTelemetry.stats.totalEvents
        });
      } else
        console.warn("[auto-zoom][main] Recording session stored without telemetry payload", {
          sessionId: typeof e.session.id == "string" ? e.session.id : void 0
        });
      const g = {
        ...e.session,
        screenVideoPath: s,
        ...n ? { cameraVideoPath: n } : {},
        ...u ? { inputTelemetryPath: u } : {},
        ...f ? { inputTelemetry: f } : {}
      };
      return M = g, V = s, console.info("[auto-zoom][main] Recording session stored in memory", {
        sessionId: typeof e.session.id == "string" ? e.session.id : void 0,
        screenVideoPath: s,
        inputTelemetryPath: u
      }), {
        success: !0,
        session: g,
        message: "Recording session stored successfully"
      };
    } catch (s) {
      return console.error("[auto-zoom][main] Failed to store recording session", s), {
        success: !1,
        message: "Failed to store recording session",
        error: String(s)
      };
    }
  }), m.handle("store-native-recording-session", async (r, e) => {
    try {
      let s = e.screenVideoPath;
      if (!e.screenVideoPath.startsWith(_)) {
        const T = `${d.parse(e.screenVideoPath).name}.mp4`;
        s = await fe(_, T), await k.copyFile(e.screenVideoPath, s);
      }
      let n = typeof e.session.micCaptured == "boolean" ? !!e.session.micCaptured : !1;
      const u = typeof e.session.micStartOffsetMs == "number" ? Number(e.session.micStartOffsetMs) : 0;
      let f;
      if (e.micAudioData && e.micAudioFileName) {
        f = d.join(_, e.micAudioFileName), await k.writeFile(f, Buffer.from(e.micAudioData));
        const T = await Ie(s, f, u);
        T.success ? n = !0 : console.warn("[native-capture][main] Failed to mux microphone audio into native capture", {
          screenVideoPath: s,
          micAudioPath: f,
          message: T.message
        });
      }
      let g;
      e.cameraVideoData && e.cameraFileName && (g = d.join(_, e.cameraFileName), await k.writeFile(g, Buffer.from(e.cameraVideoData)));
      let y, E;
      if (e.inputTelemetry) {
        const T = e.inputTelemetryFileName || `${d.parse(s).name}.telemetry.json`;
        y = d.join(_, T), await k.writeFile(y, JSON.stringify(e.inputTelemetry), "utf-8"), E = e.inputTelemetry;
      }
      const C = {
        ...{
          ...e.session,
          micCaptured: n
        },
        screenVideoPath: s,
        ...g ? { cameraVideoPath: g } : {},
        ...y ? { inputTelemetryPath: y } : {},
        ...E ? { inputTelemetry: E } : {}
      };
      return M = C, V = s, await J(f), {
        success: !0,
        session: C,
        message: "Native recording session stored successfully"
      };
    } catch (s) {
      return console.error("[native-capture][main] Failed to store native recording session", s), {
        success: !1,
        message: "Failed to store native recording session",
        error: String(s)
      };
    }
  }), m.handle("get-recorded-video-path", async () => {
    try {
      const e = (await k.readdir(_)).filter((u) => u.endsWith(".webm"));
      if (e.length === 0)
        return { success: !1, message: "No recorded video found" };
      const s = e.sort().reverse()[0];
      return { success: !0, path: d.join(_, s) };
    } catch (r) {
      return console.error("Failed to get video path:", r), { success: !1, message: "Failed to get video path", error: String(r) };
    }
  }), m.handle("set-recording-state", (r, e) => {
    e && A(), h && h(e, (P || { name: "Screen" }).name ?? "Screen");
  }), m.handle("open-external-url", async (r, e) => {
    try {
      return await me.openExternal(e), { success: !0 };
    } catch (s) {
      return console.error("Failed to open URL:", s), { success: !1, error: String(s) };
    }
  }), m.handle("get-asset-base-path", () => {
    try {
      return D.isPackaged ? d.join(process.resourcesPath, "assets") : d.join(D.getAppPath(), "public", "assets");
    } catch (r) {
      return console.error("Failed to resolve asset base path:", r), null;
    }
  }), m.handle("save-exported-video", async (r, e, s) => {
    try {
      const n = s.toLowerCase().endsWith(".gif"), u = n ? [{ name: "GIF Image", extensions: ["gif"] }] : [{ name: "MP4 Video", extensions: ["mp4"] }], f = await ie.showSaveDialog({
        title: n ? "Save Exported GIF" : "Save Exported Video",
        defaultPath: d.join(D.getPath("downloads"), s),
        filters: u,
        properties: ["createDirectory", "showOverwriteConfirmation"]
      });
      return f.canceled || !f.filePath ? {
        success: !1,
        cancelled: !0,
        message: "Export cancelled"
      } : (await k.writeFile(f.filePath, Buffer.from(e)), {
        success: !0,
        path: f.filePath,
        message: "Video exported successfully"
      });
    } catch (n) {
      return console.error("Failed to save exported video:", n), {
        success: !1,
        message: "Failed to save exported video",
        error: String(n)
      };
    }
  }), m.handle("get-default-export-directory", async () => {
    try {
      return await q(ce), { success: !0, path: ce };
    } catch (r) {
      return console.error("Failed to resolve default export directory:", r), { success: !1, message: "Failed to resolve default export directory", error: String(r) };
    }
  }), m.handle("choose-export-directory", async (r, e) => {
    try {
      const s = await ie.showOpenDialog({
        title: "Choose Export Folder",
        defaultPath: e || ce,
        properties: ["openDirectory", "createDirectory"]
      });
      if (s.canceled || s.filePaths.length === 0)
        return { success: !1, cancelled: !0, message: "Folder selection cancelled" };
      const n = s.filePaths[0];
      return await q(n), { success: !0, path: n };
    } catch (s) {
      return console.error("Failed to choose export directory:", s), { success: !1, message: "Failed to choose export directory", error: String(s) };
    }
  }), m.handle("save-exported-video-to-directory", async (r, e, s, n) => {
    try {
      await q(n);
      const u = await fe(n, s);
      return await k.writeFile(u, Buffer.from(e)), {
        success: !0,
        path: u,
        message: "Video exported successfully"
      };
    } catch (u) {
      return console.error("Failed to save exported video to directory:", u), {
        success: !1,
        message: "Failed to save exported video",
        error: String(u)
      };
    }
  }), m.handle("open-directory", async (r, e) => {
    try {
      await q(e);
      const s = await me.openPath(e);
      return s ? { success: !1, message: s } : { success: !0 };
    } catch (s) {
      return console.error("Failed to open directory:", s), { success: !1, message: "Failed to open directory", error: String(s) };
    }
  }), m.handle("open-video-file-picker", async () => {
    try {
      const r = await ie.showOpenDialog({
        title: "Select Video File",
        defaultPath: _,
        filters: [
          { name: "Video Files", extensions: ["webm", "mp4", "mov", "avi", "mkv"] },
          { name: "All Files", extensions: ["*"] }
        ],
        properties: ["openFile"]
      });
      return r.canceled || r.filePaths.length === 0 ? { success: !1, cancelled: !0 } : {
        success: !0,
        path: r.filePaths[0]
      };
    } catch (r) {
      return console.error("Failed to open file picker:", r), {
        success: !1,
        message: "Failed to open file picker",
        error: String(r)
      };
    }
  }), m.handle("set-current-video-path", async (r, e) => {
    V = e;
    const s = await Ze(e);
    return M = s ? {
      id: `session-${Date.now()}`,
      startedAtMs: Date.now(),
      screenVideoPath: e,
      micEnabled: !1,
      micCaptured: !1,
      cameraEnabled: !1,
      cameraCaptured: !1,
      screenDurationMs: 0,
      inputTelemetryPath: s.path,
      inputTelemetry: s.telemetry
    } : null, console.info("[auto-zoom][main] set-current-video-path complete", {
      videoPath: e,
      hasTelemetry: !!s,
      telemetryPath: s == null ? void 0 : s.path,
      generatedSessionId: M == null ? void 0 : M.id
    }), { success: !0 };
  }), m.handle("get-current-video-path", () => V ? { success: !0, path: V } : { success: !1 }), m.handle("clear-current-video-path", () => (V = null, M = null, { success: !0 })), m.handle("set-current-recording-session", (r, e) => (M = e, V = typeof e.screenVideoPath == "string" ? e.screenVideoPath : null, console.info("[auto-zoom][main] set-current-recording-session", {
    sessionId: typeof e.id == "string" ? e.id : void 0,
    hasTelemetry: !!e.inputTelemetry,
    telemetryPath: typeof e.inputTelemetryPath == "string" ? e.inputTelemetryPath : void 0
  }), { success: !0 })), m.handle("get-current-recording-session", () => (console.info("[auto-zoom][main] get-current-recording-session", {
    hasSession: !!M,
    sessionId: typeof (M == null ? void 0 : M.id) == "string" ? M.id : void 0,
    hasTelemetry: !!(M != null && M.inputTelemetry)
  }), M ? { success: !0, session: M } : { success: !1 })), m.handle("get-platform", () => process.platform);
}
const tt = d.dirname(de(import.meta.url)), _ = d.join(D.getPath("userData"), "recordings"), he = d.join(D.getPath("temp"), "openscreen-session-data");
D.commandLine.appendSwitch("disable-gpu-shader-disk-cache");
D.commandLine.appendSwitch("disk-cache-dir", d.join(he, "Cache"));
D.setPath("sessionData", he);
async function st() {
  try {
    await k.mkdir(_, { recursive: !0 }), console.log("RECORDINGS_DIR:", _), console.log("User Data Path:", D.getPath("userData"));
  } catch (i) {
    console.error("Failed to create recordings directory:", i);
  }
}
async function rt() {
  try {
    await k.mkdir(he, { recursive: !0 });
  } catch (i) {
    console.error("Failed to create session data directory:", i);
  }
}
process.env.APP_ROOT = d.join(tt, "..");
const ue = process.env.VITE_DEV_SERVER_URL, gt = d.join(process.env.APP_ROOT, "dist-electron"), pe = d.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = ue ? d.join(process.env.APP_ROOT, "public") : pe;
let v = null, O = null, $ = null, Pe = "";
const De = Me("openscreen.png"), ot = Me("rec-button.png");
function oe() {
  v = xe();
}
function we() {
  $ = new Ce(De), process.platform === "win32" && $.on("double-click", () => {
    v && !v.isDestroyed() ? (v.isMinimized() && v.restore(), v.show(), v.focus()) : oe();
  });
}
function Me(i) {
  return Te.createFromPath(d.join(process.env.VITE_PUBLIC || pe, i)).resize({
    width: 24,
    height: 24,
    quality: "best"
  });
}
function ye(i = !1) {
  if (!$) return;
  const t = i ? ot : De, o = i ? `Recording: ${Pe}` : "velocity", c = i ? [
    {
      label: "Stop Recording",
      click: () => {
        v && !v.isDestroyed() && v.webContents.send("stop-recording-from-tray");
      }
    }
  ] : [
    {
      label: "Open",
      click: () => {
        v && !v.isDestroyed() ? v.isMinimized() && v.restore() : oe();
      }
    },
    {
      label: "Quit",
      click: () => {
        D.quit();
      }
    }
  ];
  $.setImage(t), $.setToolTip(o), $.setContextMenu(Ae.buildFromTemplate(c));
}
function nt() {
  v && (v.close(), v = null), le(), v = We();
}
function it() {
  v && (v.close(), v = null), le(), O && !O.isDestroyed() && O.close(), O = null, v = xe();
}
function at() {
  return O = Ve(), O.on("closed", () => {
    O = null;
  }), O;
}
D.on("window-all-closed", () => {
});
D.on("activate", () => {
  L.getAllWindows().length === 0 && oe();
});
D.whenReady().then(async () => {
  await rt(), _e.defaultSession.setDisplayMediaRequestHandler(async (t, o) => {
    try {
      const c = Je(), l = await ve.getSources({
        types: ["screen", "window"],
        thumbnailSize: { width: 0, height: 0 },
        fetchWindowIcons: !1
      });
      let a = c != null && c.id ? l.find((p) => p.id === c.id) : void 0;
      if (!a && (c != null && c.display_id) && (a = l.find((p) => p.display_id === c.display_id && p.id.startsWith("screen:"))), a || (a = l.find((p) => p.id.startsWith("screen:")) || l[0]), !a) {
        o({});
        return;
      }
      o({
        video: a
      });
    } catch (c) {
      console.error("Display media handler failed:", c), o({});
    }
  }, { useSystemPicker: !1 });
  const { ipcMain: i } = await import("electron");
  i.on("hud-overlay-close", () => {
    D.quit();
  }), we(), ye(), await st(), et(
    nt,
    it,
    at,
    Oe,
    le,
    () => v,
    () => O,
    () => ze(),
    (t, o) => {
      Pe = o, $ || we(), ye(t), t || v && v.restore();
    }
  ), oe();
});
export {
  gt as MAIN_DIST,
  _ as RECORDINGS_DIR,
  pe as RENDERER_DIST,
  ue as VITE_DEV_SERVER_URL
};
