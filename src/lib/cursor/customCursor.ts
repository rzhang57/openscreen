import { Graphics } from "pixi.js";
import type { CursorVisualType, InputTelemetryFileV1 } from "@/types/inputTelemetry";

export interface CustomCursorPoint {
  ts: number;
  xNorm: number;
  yNorm: number;
  cursorType: CursorVisualType;
}

export interface CustomCursorClick {
  ts: number;
  button: number;
}

export interface CustomCursorTelemetry {
  points: CustomCursorPoint[];
  clicks: CustomCursorClick[];
}

export interface CursorRenderSample {
  xNorm: number;
  yNorm: number;
  cursorType: CursorVisualType;
}

export function buildSmoothedCursorTelemetry(telemetry?: InputTelemetryFileV1): CustomCursorTelemetry | null {
  if (!telemetry?.events?.length) return null;

  const bounds = resolveTelemetryBounds(telemetry);
  if (!bounds || bounds.width <= 0 || bounds.height <= 0) return null;

  const rawPoints: CustomCursorPoint[] = [];
  const clicks: CustomCursorClick[] = [];

  for (const event of telemetry.events) {
    if (event.type === "mouseDown") {
      clicks.push({ ts: event.ts, button: event.button });
    }
    if (event.type !== "mouseMoveSampled" && event.type !== "mouseDown" && event.type !== "mouseUp" && event.type !== "wheel") {
      continue;
    }

    const xNorm = clamp01((event.x - bounds.x) / bounds.width);
    const yNorm = clamp01((event.y - bounds.y) / bounds.height);
    rawPoints.push({
      ts: event.ts,
      xNorm,
      yNorm,
      cursorType: event.cursorType ?? inferCursorType(event.type),
    });
  }

  if (rawPoints.length < 2) {
    return rawPoints.length === 1 ? { points: rawPoints, clicks } : null;
  }

  rawPoints.sort((a, b) => a.ts - b.ts);

  // Keep smoothing but reduce lag so custom cursor stays tightly aligned with captured pointer location.
  const alpha = 0.72;
  const smoothed: CustomCursorPoint[] = [];
  let sx = rawPoints[0].xNorm;
  let sy = rawPoints[0].yNorm;

  for (const point of rawPoints) {
    sx += (point.xNorm - sx) * alpha;
    sy += (point.yNorm - sy) * alpha;
    smoothed.push({
      ts: point.ts,
      xNorm: sx,
      yNorm: sy,
      cursorType: point.cursorType,
    });
  }

  return {
    points: resampleCursorPoints(smoothed, 120),
    clicks,
  };
}

export function getCursorSampleAtTime(telemetry: CustomCursorTelemetry | null | undefined, absoluteTimeMs: number): CursorRenderSample | null {
  const points = telemetry?.points;
  if (!points?.length) return null;

  if (absoluteTimeMs <= points[0].ts) {
    return { xNorm: points[0].xNorm, yNorm: points[0].yNorm, cursorType: points[0].cursorType };
  }
  const last = points[points.length - 1];
  if (absoluteTimeMs >= last.ts) {
    return { xNorm: last.xNorm, yNorm: last.yNorm, cursorType: last.cursorType };
  }

  let low = 0;
  let high = points.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (points[mid].ts < absoluteTimeMs) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const right = points[Math.min(points.length - 1, low)];
  const left = points[Math.max(0, low - 1)];
  const dt = Math.max(1, right.ts - left.ts);
  const t = clamp01((absoluteTimeMs - left.ts) / dt);
  return {
    xNorm: left.xNorm + (right.xNorm - left.xNorm) * t,
    yNorm: left.yNorm + (right.yNorm - left.yNorm) * t,
    cursorType: t < 0.5 ? left.cursorType : right.cursorType,
  };
}

export function getCursorClickPulse(clicks: CustomCursorClick[] | undefined, absoluteTimeMs: number): number {
  if (!clicks?.length) return 0;
  const durationMs = 170;

  for (let i = clicks.length - 1; i >= 0; i -= 1) {
    const elapsed = absoluteTimeMs - clicks[i].ts;
    if (elapsed < 0) continue;
    if (elapsed > durationMs) break;
    const t = elapsed / durationMs;
    return 1 - t * t;
  }
  return 0;
}

export function drawCustomCursor(
  graphics: Graphics,
  x: number,
  y: number,
  scalePx: number,
  cursorType: CursorVisualType,
  clickPulse: number,
  velocityX: number,
  velocityY: number
) {
  graphics.clear();

  const baseScale = Math.max(10, scalePx) / 22;
  const clickScale = getPressReleaseScale(clickPulse);
  const scale = baseScale * clickScale;
  const ghostStrength = Math.min(1, Math.hypot(velocityX, velocityY) / 24);
  const offsetX = -velocityX * 0.08;
  const offsetY = -velocityY * 0.08;

  if (ghostStrength > 0.05) {
    drawCursorShape(graphics, x + offsetX * 2, y + offsetY * 2, scale, cursorType, 0.12 * ghostStrength);
    drawCursorShape(graphics, x + offsetX, y + offsetY, scale, cursorType, 0.26 * ghostStrength);
  }

  drawCursorShape(graphics, x, y, scale, cursorType, 1);
}

function drawCursorShape(
  graphics: Graphics,
  x: number,
  y: number,
  scale: number,
  _cursorType: CursorVisualType,
  alpha: number
) {
  const bodyColor = 0xffffff;
  const accentColor = 0x111111;
  const points = [
    x, y,
    x + 1 * scale, y + 20 * scale,
    x + 6 * scale, y + 15 * scale,
    x + 10 * scale, y + 22 * scale,
    x + 13 * scale, y + 21 * scale,
    x + 9 * scale, y + 14 * scale,
    x + 15 * scale, y + 14 * scale,
  ];

  graphics.poly(points).fill({ color: bodyColor, alpha: 0.95 * alpha });
  graphics.poly(points).stroke({ color: accentColor, alpha, width: Math.max(1, 1.4 * scale) });
}

function getPressReleaseScale(clickPulse: number): number {
  if (clickPulse <= 0) return 1;
  const progress = 1 - clickPulse;
  if (progress < 0.38) {
    const t = progress / 0.38;
    return 1 - 0.2 * t;
  }
  const t = (progress - 0.38) / 0.62;
  return 0.8 + 0.2 * t;
}

function resampleCursorPoints(points: CustomCursorPoint[], samplesPerSecond: number): CustomCursorPoint[] {
  if (points.length <= 2) return points;
  const interval = 1000 / samplesPerSecond;
  const start = points[0].ts;
  const end = points[points.length - 1].ts;
  const output: CustomCursorPoint[] = [];
  let sourceIndex = 0;

  for (let t = start; t <= end; t += interval) {
    while (sourceIndex < points.length - 2 && points[sourceIndex + 1].ts < t) {
      sourceIndex += 1;
    }
    const left = points[sourceIndex];
    const right = points[Math.min(points.length - 1, sourceIndex + 1)];
    const denom = Math.max(1, right.ts - left.ts);
    const ratio = clamp01((t - left.ts) / denom);
    output.push({
      ts: Math.round(t),
      xNorm: left.xNorm + (right.xNorm - left.xNorm) * ratio,
      yNorm: left.yNorm + (right.yNorm - left.yNorm) * ratio,
      cursorType: ratio < 0.5 ? left.cursorType : right.cursorType,
    });
  }

  if (output[output.length - 1]?.ts !== points[points.length - 1].ts) {
    output.push(points[points.length - 1]);
  }
  return output;
}

function inferCursorType(eventType: "mouseDown" | "mouseUp" | "mouseMoveSampled" | "wheel"): CursorVisualType {
  if (eventType === "mouseDown" || eventType === "mouseUp") return "pointer";
  return "default";
}

function resolveTelemetryBounds(telemetry: InputTelemetryFileV1): { x: number; y: number; width: number; height: number } | null {
  const explicit = telemetry.sourceBounds;
  if (explicit && explicit.width > 0 && explicit.height > 0) {
    return explicit;
  }

  const pointerEvents = telemetry.events.filter(
    (event): event is Extract<InputTelemetryFileV1["events"][number], { x: number; y: number }> =>
      (event.type === "mouseMoveSampled" || event.type === "mouseDown" || event.type === "mouseUp" || event.type === "wheel") &&
      Number.isFinite(event.x) &&
      Number.isFinite(event.y)
  );

  if (pointerEvents.length === 0) {
    return null;
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const event of pointerEvents) {
    minX = Math.min(minX, event.x);
    minY = Math.min(minY, event.y);
    maxX = Math.max(maxX, event.x);
    maxY = Math.max(maxY, event.y);
  }

  const width = maxX - minX;
  const height = maxY - minY;
  if (width <= 2 || height <= 2) {
    return { x: 0, y: 0, width: 1920, height: 1080 };
  }

  const padX = Math.max(24, width * 0.08);
  const padY = Math.max(24, height * 0.08);
  return {
    x: minX - padX,
    y: minY - padY,
    width: width + padX * 2,
    height: height + padY * 2,
  };
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}
