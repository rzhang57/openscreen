import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";

interface VideoPlaybackProps {
  videoPath: string;
  isSeeking: React.MutableRefObject<boolean>;
  onDurationChange: (duration: number) => void;
  onTimeUpdate: (time: number) => void;
  onPlayStateChange: (playing: boolean) => void;
  onError: (error: string) => void;
  wallpaper?: string;
}

export interface VideoPlaybackRef {
  video: HTMLVideoElement | null;
}

const VideoPlayback = forwardRef<VideoPlaybackRef, VideoPlaybackProps>(({
  videoPath,
  isSeeking,
  onDurationChange,
  onTimeUpdate,
  onPlayStateChange,
  onError,
  wallpaper,
}, ref) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawFrameRef = useRef<(() => void) | null>(null);

  useImperativeHandle(ref, () => ({
    video: videoRef.current,
  }));

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let animationId: number;
    function drawFrame() {
      if (!video || !canvas) return;
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Apply rounded rectangle clipping path with consistent radius
        const radius = Math.min(canvas.width, canvas.height) * 0.02;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.lineTo(canvas.width - radius, 0);
        ctx.quadraticCurveTo(canvas.width, 0, canvas.width, radius);
        ctx.lineTo(canvas.width, canvas.height - radius);
        ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - radius, canvas.height);
        ctx.lineTo(radius, canvas.height);
        ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
        ctx.closePath();
        ctx.clip();
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
    }
    
    // Store drawFrame in a ref so handleLoadedMetadata can use it
    drawFrameRef.current = drawFrame;
    function drawFrameLoop() {
      if (!video || !canvas || video.paused || video.ended) return;
      drawFrame();
      animationId = requestAnimationFrame(drawFrameLoop);
    }
    const handlePlay = () => drawFrameLoop();
    const handlePause = () => cancelAnimationFrame(animationId);
    const handleSeeked = () => {
      drawFrame();
    };
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handlePause);
    video.addEventListener('seeked', handleSeeked);
    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handlePause);
      video.removeEventListener('seeked', handleSeeked);
      cancelAnimationFrame(animationId);
    };
  }, [videoPath]);

  // Draw first frame when metadata is loaded
  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    onDurationChange(e.currentTarget.duration);
    // Draw first frame
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      const drawFirstFrame = () => {
        // Use the shared drawFrame function from the ref
        drawFrameRef.current?.();
        video.removeEventListener('seeked', drawFirstFrame);
      };
      video.addEventListener('seeked', drawFirstFrame);
      if (video.currentTime === 0 && video.readyState >= 2) {
        drawFirstFrame();
      }
    }
  };

  const isImageUrl = wallpaper?.startsWith('/wallpapers/') || wallpaper?.startsWith('http');
  const backgroundStyle = isImageUrl 
    ? { backgroundImage: `url(${wallpaper || '/wallpapers/wallpaper1.jpg'})` }
    : { background: wallpaper || '/wallpapers/wallpaper1.jpg' };

  return (
    <div
      className="aspect-video rounded-sm p-12 flex items-center justify-center overflow-hidden bg-cover bg-center"
      style={{ ...backgroundStyle, width: '90%' }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain rounded-lg"
      />
      <video
        ref={videoRef}
        src={videoPath}
        className="hidden rounded"
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onDurationChange={e => {
          onDurationChange(e.currentTarget.duration);
        }}
        onTimeUpdate={e => {
          if (!isSeeking.current) onTimeUpdate(e.currentTarget.currentTime);
        }}
        onError={() => onError('Failed to load video')}
        onPlay={() => onPlayStateChange(true)}
        onPause={() => onPlayStateChange(false)}
        onEnded={() => onPlayStateChange(false)}
      />
    </div>
  );
});

VideoPlayback.displayName = 'VideoPlayback';

export default VideoPlayback;
