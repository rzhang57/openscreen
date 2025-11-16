import { useCallback, useEffect, useMemo, useState } from "react";
import { useTimelineContext } from "dnd-timeline";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import TimelineWrapper from "./TimelineWrapper";
import Row from "./Row";
import Item from "./Item";
import type { Range, Span } from "dnd-timeline";
import type { ZoomRegion } from "../types";

const ROW_ID = "row-1";
const FALLBACK_RANGE_MS = 1000;
const TARGET_MARKER_COUNT = 12;

interface TimelineEditorProps {
  videoDuration: number;
  currentTime: number;
  onSeek?: (time: number) => void;
  zoomRegions: ZoomRegion[];
  onZoomAdded: (span: Span) => void;
  onZoomSpanChange: (id: string, span: Span) => void;
  onZoomDelete: (id: string) => void;
  selectedZoomId: string | null;
  onSelectZoom: (id: string | null) => void;
}

interface TimelineScaleConfig {
  intervalMs: number;
  gridMs: number;
  minItemDurationMs: number;
  defaultItemDurationMs: number;
  minVisibleRangeMs: number;
}

interface TimelineRenderItem {
  id: string;
  rowId: string;
  span: Span;
  label: string;
}

const SCALE_CANDIDATES = [
  { intervalSeconds: 0.25, gridSeconds: 0.05 },
  { intervalSeconds: 0.5, gridSeconds: 0.1 },
  { intervalSeconds: 1, gridSeconds: 0.25 },
  { intervalSeconds: 2, gridSeconds: 0.5 },
  { intervalSeconds: 5, gridSeconds: 1 },
  { intervalSeconds: 10, gridSeconds: 2 },
  { intervalSeconds: 15, gridSeconds: 3 },
  { intervalSeconds: 30, gridSeconds: 5 },
  { intervalSeconds: 60, gridSeconds: 10 },
  { intervalSeconds: 120, gridSeconds: 20 },
  { intervalSeconds: 300, gridSeconds: 30 },
  { intervalSeconds: 600, gridSeconds: 60 },
  { intervalSeconds: 900, gridSeconds: 120 },
  { intervalSeconds: 1800, gridSeconds: 180 },
  { intervalSeconds: 3600, gridSeconds: 300 },
];

function calculateTimelineScale(durationSeconds: number): TimelineScaleConfig {
  const totalMs = Math.max(0, Math.round(durationSeconds * 1000));

  const selectedCandidate = SCALE_CANDIDATES.find((candidate) => {
    if (durationSeconds <= 0) {
      return true;
    }
    const markers = durationSeconds / candidate.intervalSeconds;
    return markers <= TARGET_MARKER_COUNT;
  }) ?? SCALE_CANDIDATES[SCALE_CANDIDATES.length - 1];

  const intervalMs = Math.round(selectedCandidate.intervalSeconds * 1000);
  const gridMs = Math.round(selectedCandidate.gridSeconds * 1000);

  // Set minItemDurationMs to 1ms for maximum granularity
  const minItemDurationMs = 1;
  const defaultItemDurationMs = Math.min(
    Math.max(minItemDurationMs, intervalMs * 2),
    totalMs > 0 ? totalMs : intervalMs * 2,
  );

  const minVisibleRangeMs = totalMs > 0
    ? Math.min(Math.max(intervalMs * 3, minItemDurationMs * 6, 1000), totalMs)
    : Math.max(intervalMs * 3, minItemDurationMs * 6, 1000);

  return {
    intervalMs,
    gridMs,
    minItemDurationMs,
    defaultItemDurationMs,
    minVisibleRangeMs,
  };
}

function createInitialRange(totalMs: number): Range {
  if (totalMs > 0) {
    return { start: 0, end: totalMs };
  }

  return { start: 0, end: FALLBACK_RANGE_MS };
}

function formatTimeLabel(milliseconds: number, intervalMs: number) {
  const totalSeconds = milliseconds / 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const fractionalDigits = intervalMs < 250 ? 2 : intervalMs < 1000 ? 1 : 0;

  if (hours > 0) {
    const minutesString = minutes.toString().padStart(2, "0");
    const secondsString = Math.floor(seconds)
      .toString()
      .padStart(2, "0");
    return `${hours}:${minutesString}:${secondsString}`;
  }

  if (fractionalDigits > 0) {
    const secondsWithFraction = seconds.toFixed(fractionalDigits);
    const [wholeSeconds, fraction] = secondsWithFraction.split(".");
    return `${minutes}:${wholeSeconds.padStart(2, "0")}.${fraction}`;
  }

  return `${minutes}:${Math.floor(seconds).toString().padStart(2, "0")}`;
}

function PlaybackCursor({ 
  currentTimeMs, 
  videoDurationMs 
}: { 
  currentTimeMs: number; 
  videoDurationMs: number;
}) {
  const { sidebarWidth, direction, range, valueToPixels } = useTimelineContext();
  const sideProperty = direction === "rtl" ? "right" : "left";

  if (videoDurationMs <= 0 || currentTimeMs < 0) {
    return null;
  }

  const clampedTime = Math.min(currentTimeMs, videoDurationMs);
  
  if (clampedTime < range.start || clampedTime > range.end) {
    return null;
  }

  const offset = valueToPixels(clampedTime - range.start);

  return (
    <div
      className="absolute top-0 bottom-0 pointer-events-none z-50"
      style={{
        [sideProperty === "right" ? "marginRight" : "marginLeft"]: `${sidebarWidth - 8}px`, // reduce margin
      }}
    >
      <div
        className="absolute top-3 bottom-3 w-[2px] bg-red-500/90 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
        style={{
          [sideProperty]: `${offset}px`,
        }}
      >
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 flex flex-col items-center"
          style={{ width: '32px' }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              background: '#ef4444',
              borderRadius: '12px 12px 12px 12px/14px 14px 8px 8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 600,
              color: '#ef4444',
              letterSpacing: '-0.5px',
              position: 'relative',
            }}
          >
  
          </div>
         
        </div>
        {/* Subtle glow at top */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500/30 rounded-full blur-sm" />
      </div>
    </div>
  );
}

function TimelineAxis({
  intervalMs,
  videoDurationMs,
  currentTimeMs,
}: {
  intervalMs: number;
  videoDurationMs: number;
  currentTimeMs: number;
}) {
  const { sidebarWidth, direction, range, valueToPixels } = useTimelineContext();
  const sideProperty = direction === "rtl" ? "right" : "left";

  const markers = useMemo(() => {
    if (intervalMs <= 0) {
      return [] as { time: number; label: string }[];
    }

    const maxTime = videoDurationMs > 0 ? videoDurationMs : range.end;
    const visibleStart = Math.max(0, Math.min(range.start, maxTime));
    const visibleEnd = Math.min(range.end, maxTime);
    const markerTimes = new Set<number>();

    const firstMarker = Math.ceil(visibleStart / intervalMs) * intervalMs;

    for (let time = firstMarker; time <= maxTime; time += intervalMs) {
      if (time >= visibleStart && time <= visibleEnd) {
        markerTimes.add(Math.round(time));
      }
    }

    if (visibleStart <= maxTime) {
      markerTimes.add(Math.round(visibleStart));
    }
    
    if (videoDurationMs > 0) {
      markerTimes.add(Math.round(videoDurationMs));
    }

    const sorted = Array.from(markerTimes)
      .filter(time => time <= maxTime)
      .sort((a, b) => a - b);

    return sorted.map((time) => ({
      time,
      label: formatTimeLabel(time, intervalMs),
    }));
  }, [intervalMs, range.end, range.start, videoDurationMs]);

  return (
    <div
      className="h-10 bg-black border-b border-[#18181b] relative overflow-hidden"
      style={{
        [sideProperty === "right" ? "marginRight" : "marginLeft"]: `${sidebarWidth}px`,
      }}
    >
      {markers.map((marker) => {
        const offset = valueToPixels(marker.time - range.start);
        const markerStyle: React.CSSProperties = {
          position: "absolute",
          bottom: 0,
          height: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-end",
          [sideProperty]: `${offset}px`,
        };

        return (
          <div key={marker.time} style={markerStyle}>
            <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <div
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  backgroundColor: marker.time === currentTimeMs ? '#34B27B' : '#94a3b8',
                  boxShadow: marker.time === currentTimeMs ? '0 0 4px #34B27B55' : 'none',
                  marginRight: '5px',
                  marginTop: '2px',
                  transition: 'background 0.2s, box-shadow 0.2s',
                }}
              />
              <span
                style={{
                  fontWeight: marker.time === currentTimeMs ? 700 : 500,
                  color: marker.time === currentTimeMs ? '#34B27B' : '#94a3b8',
                  fontSize: '11px',
                  letterSpacing: '-0.5px',
                  textShadow: marker.time === currentTimeMs ? '0 1px 6px #34B27B33' : 'none',
                  marginTop: '2px',
                }}
                className="select-none"
              >
                {marker.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Timeline({
  items,
  videoDurationMs,
  intervalMs,
     currentTimeMs,
  onSeek,
  onSelectZoom,
  selectedZoomId,
}: {
  items: TimelineRenderItem[];
  videoDurationMs: number;
  intervalMs: number;
  currentTimeMs: number;
  onSeek?: (time: number) => void;
  onSelectZoom?: (id: string | null) => void;
  selectedZoomId: string | null;
}) {
  const { setTimelineRef, style, sidebarWidth, range, pixelsToValue } = useTimelineContext();

  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || videoDurationMs <= 0) return;
    onSelectZoom?.(null);

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left - sidebarWidth;
    
    if (clickX < 0) return;
    
    const relativeMs = pixelsToValue(clickX);
    const absoluteMs = Math.max(0, Math.min(range.start + relativeMs, videoDurationMs));
    const timeInSeconds = absoluteMs / 1000;
    
    onSeek(timeInSeconds);
  }, [onSeek, onSelectZoom, videoDurationMs, sidebarWidth, range.start, pixelsToValue]);

  return (
    <div
      ref={setTimelineRef}
      style={style}
      className="select-none bg-black min-h-[120px] relative cursor-pointer"
      onClick={handleTimelineClick}
    >
         <TimelineAxis intervalMs={intervalMs} videoDurationMs={videoDurationMs} currentTimeMs={currentTimeMs} />
      <PlaybackCursor currentTimeMs={currentTimeMs} videoDurationMs={videoDurationMs} />
      <Row id={ROW_ID}>
        {items.map((item) => (
          <Item
            id={item.id}
            key={item.id}
            rowId={item.rowId}
            span={item.span}
            isSelected={item.id === selectedZoomId}
            onSelect={() => onSelectZoom?.(item.id)}
          >
            {item.label}
          </Item>
        ))}
      </Row>
    </div>
  );
}

export default function TimelineEditor({
  videoDuration,
  currentTime,
  onSeek,
  zoomRegions,
  onZoomAdded,
  onZoomSpanChange,
  selectedZoomId,
  onSelectZoom,
}: TimelineEditorProps) {
  const totalMs = useMemo(() => Math.max(0, Math.round(videoDuration * 1000)), [videoDuration]);
  const currentTimeMs = useMemo(() => Math.round(currentTime * 1000), [currentTime]);
  const timelineScale = useMemo(() => calculateTimelineScale(videoDuration), [videoDuration]);
  const safeMinDurationMs = useMemo(
    () => (totalMs > 0 ? Math.min(timelineScale.minItemDurationMs, totalMs) : timelineScale.minItemDurationMs),
    [timelineScale.minItemDurationMs, totalMs],
  );

  const [range, setRange] = useState<Range>(() => createInitialRange(totalMs));

  useEffect(() => {
    setRange(createInitialRange(totalMs));
  }, [totalMs]);

  useEffect(() => {
    if (totalMs === 0 || safeMinDurationMs <= 0) {
      return;
    }

    zoomRegions.forEach((region) => {
      const clampedStart = Math.max(0, Math.min(region.startMs, totalMs));
      const minEnd = clampedStart + safeMinDurationMs;
      const clampedEnd = Math.min(totalMs, Math.max(minEnd, region.endMs));
      const normalizedStart = Math.max(0, Math.min(clampedStart, totalMs - safeMinDurationMs));
      const normalizedEnd = Math.max(minEnd, Math.min(clampedEnd, totalMs));

      if (normalizedStart !== region.startMs || normalizedEnd !== region.endMs) {
        onZoomSpanChange(region.id, { start: normalizedStart, end: normalizedEnd });
      }
    });
  }, [zoomRegions, totalMs, safeMinDurationMs, onZoomSpanChange]);

  const hasOverlap = useCallback((newSpan: Span, excludeId?: string): boolean => {
    // Snap if gap is 2ms or less
    return zoomRegions.some((region) => {
      if (region.id === excludeId) return false;
      // If the new span is within 2ms of another region, treat as overlap (snap)
      const gapBefore = newSpan.start - region.endMs;
      const gapAfter = region.startMs - newSpan.end;
      if (gapBefore > 0 && gapBefore <= 2) return true;
      if (gapAfter > 0 && gapAfter <= 2) return true;
      return !(newSpan.end <= region.startMs || newSpan.start >= region.endMs);
    });
  }, [zoomRegions]);

  const handleAddZoom = useCallback(() => {
    if (!videoDuration || videoDuration === 0 || totalMs === 0) {
      return;
    }

    const defaultDuration = Math.min(
      Math.max(3000, safeMinDurationMs),
      totalMs,
    );

    if (defaultDuration <= 0) {
      return;
    }

    let startPos = 0;
    const sorted = [...zoomRegions].sort((a, b) => a.startMs - b.startMs);

    for (const region of sorted) {
      if (startPos + defaultDuration <= region.startMs) {
        break;
      }
      startPos = Math.max(startPos, region.endMs);
    }

    if (startPos + defaultDuration > totalMs) {
      toast.error("No space available", {
        description: "Remove or resize existing zoom regions to add more.",
      });
      return;
    }

    onZoomAdded({ start: startPos, end: startPos + defaultDuration });
  }, [videoDuration, totalMs, timelineScale.defaultItemDurationMs, safeMinDurationMs, zoomRegions, onZoomAdded]);

  const clampedRange = useMemo<Range>(() => {
    if (totalMs === 0) {
      return range;
    }

    return {
      start: Math.max(0, Math.min(range.start, totalMs)),
      end: Math.min(range.end, totalMs),
    };
  }, [range, totalMs]);

  const timelineItems = useMemo<TimelineRenderItem[]>(() => {
    return [...zoomRegions]
      .sort((a, b) => a.startMs - b.startMs)
      .map((region, index) => ({
        id: region.id,
        rowId: ROW_ID,
        span: { start: region.startMs, end: region.endMs },
        label: `Zoom ${index + 1}`,
      }));
  }, [zoomRegions]);

  if (!videoDuration || videoDuration === 0) {
    return (
      <div className="flex-1 flex items-center justify-center rounded-lg">
        <span className="text-slate-400 text-sm">Load a video to see timeline</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-black border border-none rounded-xl shadow-lg overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2.5">
        <Button onClick={handleAddZoom} variant="outline" size="sm" className="gap-2 h-8 px-3 text-xs bg-[#23232a] border-none text-slate-200 hover:bg-white hover:text-black">
          <Plus className="w-3.5 h-3.5 text-slate-400" />
          Add Zoom
        </Button>
        <div className="flex-1" />
        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-[#23232a]  rounded text-slate-300">Command + Shift + Scroll</kbd>
            <span>Pan</span>
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-[#23232a]  rounded text-slate-300">Command + Scroll</kbd>
            <span>Zoom</span>
          </span>
        </div>
      </div>
      <div className="mt-4 flex-1 overflow-x-auto overflow-y-hidden bg-[#000]">
        <TimelineWrapper
          range={clampedRange}
          videoDuration={videoDuration}
          hasOverlap={hasOverlap}
          onRangeChange={setRange}
          minItemDurationMs={timelineScale.minItemDurationMs}
          minVisibleRangeMs={timelineScale.minVisibleRangeMs}
          gridSizeMs={timelineScale.gridMs}
          onItemSpanChange={onZoomSpanChange}
        >
          <Timeline
            items={timelineItems}
            videoDurationMs={totalMs}
            intervalMs={timelineScale.intervalMs}
            currentTimeMs={currentTimeMs}
            onSeek={onSeek}
            onSelectZoom={onSelectZoom}
            selectedZoomId={selectedZoomId}
          />
        </TimelineWrapper>
      </div>
    </div>
  );
}
