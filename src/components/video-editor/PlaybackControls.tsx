import { Button } from "../ui/button";
import { MdPlayArrow, MdPause } from "react-icons/md";

interface PlaybackControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlayPause: () => void;
  onSeek: (time: number) => void;
}

export default function PlaybackControls({
  isPlaying,
  currentTime,
  duration,
  onTogglePlayPause,
  onSeek,
}: PlaybackControlsProps) {
  function formatTime(seconds: number) {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function handleSeekChange(e: React.ChangeEvent<HTMLInputElement>) {
    onSeek(parseFloat(e.target.value));
  }

  return (
    <div className="flex items-center gap-4 px-4 rounded-xl py-3">
      <Button
        onClick={onTogglePlayPause}
        size="icon"
        className="w-8 h-8 rounded-full bg-transparent text-slate-200 hover:bg-[#18181b] transition-colors border border-white"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <MdPause width={18} height={18} />
        ) : (
          <MdPlayArrow width={18} height={18} />
        )}
      </Button>
      <span className="text-xs text-slate-400 font-mono">
        {formatTime(currentTime)}
      </span>
      <input
        type="range"
        min="0"
        max={duration}
        value={currentTime}
        onChange={handleSeekChange}
        step="0.01"
        className="flex-1 h-2 rounded-full transition-all duration-[33ms] custom-playback-range"
        style={{
          background: `linear-gradient(to right, #34B27B 0%, #34B27B ${(currentTime / duration) * 100}%, #23232a ${(currentTime / duration) * 100}%, #23232a 100%)`,
        }}
      />
      <span className="text-xs text-slate-400 font-mono">
        {formatTime(duration)}
      </span>
    </div>
  );
}
