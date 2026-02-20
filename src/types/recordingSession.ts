import type { InputTelemetryFileV1 } from "./inputTelemetry";

export interface RecordingSession {
  id: string;
  startedAtMs: number;
  screenVideoPath: string;
  cameraVideoPath?: string;
  micEnabled: boolean;
  micCaptured: boolean;
  cameraEnabled: boolean;
  cameraCaptured: boolean;
  cameraStartOffsetMs?: number;
  screenDurationMs: number;
  cameraDurationMs?: number;
  requestedCaptureFps?: 60 | 120;
  actualCaptureFps?: number;
  requestedCaptureWidth?: number;
  requestedCaptureHeight?: number;
  actualCaptureWidth?: number;
  actualCaptureHeight?: number;
  inputTelemetryPath?: string;
  inputTelemetry?: InputTelemetryFileV1;
  autoZoomGeneratedAtMs?: number;
  autoZoomAlgorithmVersion?: string;
  customCursorEnabled?: boolean;
  captureBackend?: "native-sidecar" | "legacy-electron";
  recordingCodec?: "h264_libx264" | "h264_nvenc" | "hevc_nvenc";
}

export interface CameraHiddenRegion {
  id: string;
  startMs: number;
  endMs: number;
}
