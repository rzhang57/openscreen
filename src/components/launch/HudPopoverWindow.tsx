import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { Camera, Mic, Settings2, X } from "lucide-react";

type PopoverKind = "recording" | "media";
type MicProcessingMode = "raw" | "cleaned";
type RecordingPreset = "performance" | "balanced" | "quality";
type RecordingFps = 60 | 120;

type HudSettings = {
  micEnabled: boolean;
  selectedMicDeviceId: string;
  micProcessingMode: MicProcessingMode;
  cameraEnabled: boolean;
  cameraPreviewEnabled: boolean;
  selectedCameraDeviceId: string;
  recordingPreset: RecordingPreset;
  recordingFps: RecordingFps;
};

const defaultSettings: HudSettings = {
  micEnabled: true,
  selectedMicDeviceId: "",
  micProcessingMode: "cleaned",
  cameraEnabled: false,
  cameraPreviewEnabled: true,
  selectedCameraDeviceId: "",
  recordingPreset: "quality",
  recordingFps: 60,
};

export function HudPopoverWindow() {
  const [kind, setKind] = useState<PopoverKind>(() => {
    const params = new URLSearchParams(window.location.search);
    const windowKind = params.get("kind");
    return windowKind === "media" || windowKind === "recording" ? windowKind : "recording";
  });
  const [settings, setSettings] = useState<HudSettings>(defaultSettings);
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const windowKind = params.get("kind");
    if (windowKind === "media" || windowKind === "recording") {
      setKind(windowKind);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    window.electronAPI?.getHudSettings().then((result) => {
      if (mounted && result?.success) {
        setSettings(result.settings);
      }
    }).catch(() => {});

    const unsubscribe = window.electronAPI?.onHudSettingsUpdated?.((updated) => {
      if (mounted) {
        setSettings(updated);
      }
    });

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (kind !== "media") return;
    const loadDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setMicDevices(devices.filter((d) => d.kind === "audioinput"));
        setCameraDevices(devices.filter((d) => d.kind === "videoinput"));
      } catch {
        setMicDevices([]);
        setCameraDevices([]);
      }
    };

    loadDevices();
    navigator.mediaDevices.addEventListener?.("devicechange", loadDevices);
    return () => {
      navigator.mediaDevices.removeEventListener?.("devicechange", loadDevices);
    };
  }, [kind]);

  const update = (partial: Partial<HudSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
    window.electronAPI?.updateHudSettings(partial).catch(() => {});
  };

  const closeSelf = useCallback(() => {
    const api = window.electronAPI;
    if (api?.closeCurrentHudPopoverWindow) {
      api.closeCurrentHudPopoverWindow().catch(() => {});
      return;
    }
    if (api?.closeHudPopoverWindow) {
      api.closeHudPopoverWindow(kind).catch(() => {});
      return;
    }
    window.close();
  }, [kind]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeSelf();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeSelf]);

  return (
    <div className="w-full h-full bg-transparent p-2 box-border overflow-hidden" onMouseDown={closeSelf}>
      <div className="w-full h-full box-border overflow-hidden rounded-xl border border-white/15 bg-[#0f1012]/95 backdrop-blur-xl p-3 text-white" onMouseDown={(e) => e.stopPropagation()}>
        <div className="relative mb-2 h-4">
          <div
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
            style={{ WebkitAppRegion: "drag" } as CSSProperties}
          />
          <div className="absolute left-0 top-0 flex items-center gap-1 z-10" style={{ WebkitAppRegion: "no-drag" } as CSSProperties}>
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                closeSelf();
              }}
              className="group w-3 h-3 rounded-full bg-[#ff5f57] border border-[#d64541]/70 flex items-center justify-center"
              title="Close"
            >
              <X size={8} className="text-black/70 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-[10px] tracking-[0.06em] text-slate-500">
              {kind === "recording" ? "Recording" : "Media settings"}
            </div>
          </div>
        </div>
        {kind === "recording" ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Settings2 size={14} className="text-slate-200" />
              <div className="text-xs font-semibold text-slate-200">Recording Settings</div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-slate-500">Preset</label>
              <div className="grid grid-cols-3 gap-1">
                {(["performance", "balanced", "quality"] as const).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => update({ recordingPreset: preset })}
                    className={`h-7 rounded-md text-[10px] font-medium border ${
                      settings.recordingPreset === preset
                        ? "bg-white text-black border-white"
                        : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {preset[0].toUpperCase() + preset.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-slate-500">FPS</label>
              <div className="grid grid-cols-2 gap-1">
                {[60, 120].map((fps) => (
                  <button
                    key={fps}
                    type="button"
                    onClick={() => update({ recordingFps: fps as RecordingFps })}
                    className={`h-7 rounded-md text-[10px] font-medium border ${
                      settings.recordingFps === fps
                        ? "bg-white text-black border-white"
                        : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {fps} FPS
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-200">Microphone & Camera</div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500">
                <Mic size={12} />
                Microphone
              </div>
              <select
                className="w-full h-7 text-[10px] bg-[#1c1c1c] text-white border border-white/20 rounded-md px-1.5 outline-none"
                style={{ colorScheme: "dark" }}
                value={settings.selectedMicDeviceId}
                disabled={micDevices.length === 0}
                onChange={(e) => update({ selectedMicDeviceId: e.target.value })}
              >
                {micDevices.length === 0 ? (
                  <option value="" className="bg-white text-black">No microphone</option>
                ) : (
                  micDevices.map((device, index) => (
                    <option key={device.deviceId} value={device.deviceId} className="bg-white text-black">
                      {device.label || `Microphone ${index + 1}`}
                    </option>
                  ))
                )}
              </select>
              <select
                className="w-full h-7 text-[10px] bg-[#1c1c1c] text-white border border-white/20 rounded-md px-1.5 outline-none"
                style={{ colorScheme: "dark" }}
                value={settings.micProcessingMode}
                onChange={(e) => update({ micProcessingMode: e.target.value as MicProcessingMode })}
              >
                <option value="cleaned" className="bg-white text-black">Cleaned</option>
                <option value="raw" className="bg-white text-black">Raw</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500">
                <Camera size={12} />
                Camera
              </div>
              <select
                className="w-full h-7 text-[10px] bg-[#1c1c1c] text-white border border-white/20 rounded-md px-1.5 outline-none"
                style={{ colorScheme: "dark" }}
                value={settings.selectedCameraDeviceId}
                disabled={cameraDevices.length === 0}
                onChange={(e) => update({ selectedCameraDeviceId: e.target.value })}
              >
                {cameraDevices.length === 0 ? (
                  <option value="" className="bg-white text-black">No camera</option>
                ) : (
                  cameraDevices.map((device, index) => (
                    <option key={device.deviceId} value={device.deviceId} className="bg-white text-black">
                      {device.label || `Camera ${index + 1}`}
                    </option>
                  ))
                )}
              </select>
              <button
                type="button"
                onClick={() => update({ cameraPreviewEnabled: !settings.cameraPreviewEnabled })}
                className={`w-full h-7 rounded-md text-[10px] font-medium border ${
                  settings.cameraPreviewEnabled
                    ? "bg-white text-black border-white"
                    : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                }`}
              >
                {settings.cameraPreviewEnabled ? "Preview On" : "Preview Off"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
