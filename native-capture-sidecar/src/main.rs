use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::io::{self, BufRead, Write};
use std::path::Path;
use std::process::{Child, Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[derive(Debug, Deserialize)]
struct Request {
    id: String,
    cmd: String,
    #[serde(default)]
    payload: Value,
}

#[derive(Debug, Serialize)]
struct Response<'a> {
    id: &'a str,
    ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    payload: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

#[derive(Debug, Deserialize)]
struct StartCapturePayload {
    #[serde(rename = "sessionId")]
    session_id: String,
    source: CaptureSource,
    video: VideoConfig,
    cursor: CursorConfig,
    #[serde(rename = "outputPath")]
    output_path: String,
    platform: String,
    #[serde(rename = "ffmpegPath")]
    ffmpeg_path: Option<String>,
    #[serde(rename = "captureRegion")]
    capture_region: Option<CaptureRegion>,
}

#[derive(Debug, Deserialize)]
struct CaptureSource {
    #[serde(rename = "type")]
    source_type: String,
    name: Option<String>,
}

#[derive(Debug, Deserialize)]
struct VideoConfig {
    width: u32,
    height: u32,
    fps: u32,
    bitrate: u32,
    codec: String,
}

#[derive(Debug, Deserialize)]
struct CursorConfig {
    mode: String,
}

#[derive(Debug, Deserialize)]
struct CaptureRegion {
    x: i32,
    y: i32,
    width: u32,
    height: u32,
}

#[derive(Debug, Deserialize)]
struct StopCapturePayload {
    #[serde(rename = "sessionId")]
    session_id: String,
    #[allow(dead_code)]
    finalize: Option<bool>,
}

struct ActiveCapture {
    session_id: String,
    output_path: String,
    width: u32,
    height: u32,
    fps: u32,
    started_at: Instant,
    child: Child,
}

fn main() {
    let stdin = io::stdin();
    let mut stdout = io::stdout();
    let mut active_capture: Option<ActiveCapture> = None;

    for line in stdin.lock().lines() {
        let line = match line {
            Ok(v) => v,
            Err(_) => continue,
        };
        if line.trim().is_empty() {
            continue;
        }

        let request: Request = match serde_json::from_str(&line) {
            Ok(v) => v,
            Err(err) => {
                let _ = writeln!(
                    stdout,
                    "{}",
                    json!({
                        "ok": false,
                        "error": format!("invalid request json: {err}")
                    })
                );
                let _ = stdout.flush();
                continue;
            }
        };

        let response = match request.cmd.as_str() {
            "init" => Response {
                id: &request.id,
                ok: true,
                payload: Some(json!({
                    "version": "0.2.0",
                    "backend": "ffmpeg-gdigrab",
                    "status": "ready"
                })),
                error: None,
            },
            "start_capture" => handle_start(&request.id, request.payload, &mut active_capture),
            "stop_capture" => handle_stop(&request.id, request.payload, &mut active_capture),
            _ => Response {
                id: &request.id,
                ok: false,
                payload: None,
                error: Some(format!("unknown command: {}", request.cmd)),
            },
        };

        if writeln!(
            stdout,
            "{}",
            serde_json::to_string(&response)
                .unwrap_or_else(|_| "{\"ok\":false,\"error\":\"serialize failed\"}".to_string())
        )
        .is_err()
        {
            continue;
        }
        let _ = stdout.flush();
    }
}

fn handle_start<'a>(
    id: &'a str,
    payload: Value,
    active_capture: &mut Option<ActiveCapture>,
) -> Response<'a> {
    if active_capture.is_some() {
        return Response {
            id,
            ok: false,
            payload: None,
            error: Some("capture already running".to_string()),
        };
    }

    let start_payload: StartCapturePayload = match serde_json::from_value(payload) {
        Ok(v) => v,
        Err(err) => {
            return Response {
                id,
                ok: false,
                payload: None,
                error: Some(format!("invalid start_capture payload: {err}")),
            };
        }
    };

    if start_payload.platform != "win32" {
        return Response {
            id,
            ok: false,
            payload: None,
            error: Some("native sidecar backend currently implemented for Windows only".to_string()),
        };
    }

    if start_payload.video.width == 0 || start_payload.video.height == 0 || start_payload.video.fps == 0 {
        return Response {
            id,
            ok: false,
            payload: None,
            error: Some("invalid video dimensions/fps".to_string()),
        };
    }

    let ffmpeg_exe = resolve_ffmpeg_path(start_payload.ffmpeg_path.as_deref());
    if ffmpeg_exe.is_none() {
        return Response {
            id,
            ok: false,
            payload: None,
            error: Some("ffmpeg executable not found (bundle native-capture-sidecar/bin/win32/ffmpeg.exe or install ffmpeg on PATH)".to_string()),
        };
    }
    let ffmpeg_exe = ffmpeg_exe.unwrap_or_else(|| "ffmpeg".to_string());

    let draw_mouse = if start_payload.cursor.mode == "hide" { "0" } else { "1" };
    let bitrate = format!("{}", start_payload.video.bitrate.max(1_000_000));
    let output_path = start_payload.output_path.clone();
    let source_dimensions = if start_payload.source.source_type == "screen" {
        start_payload
            .capture_region
            .as_ref()
            .map(|region| (region.width.max(1), region.height.max(1)))
    } else {
        None
    };
    let needs_scale = match source_dimensions {
        Some((src_w, src_h)) => src_w != start_payload.video.width || src_h != start_payload.video.height,
        None => start_payload.source.source_type == "window",
    };

    let mut command = Command::new(ffmpeg_exe);
    #[cfg(target_os = "windows")]
    {
        const BELOW_NORMAL_PRIORITY_CLASS: u32 = 0x0000_4000;
        command.creation_flags(BELOW_NORMAL_PRIORITY_CLASS);
    }
    command
        .arg("-y")
        .arg("-f")
        .arg("gdigrab")
        .arg("-thread_queue_size")
        .arg("2048")
        .arg("-framerate")
        .arg(format!("{}", start_payload.video.fps))
        .arg("-draw_mouse")
        .arg(draw_mouse);

    if start_payload.source.source_type == "screen" {
        if let Some(region) = &start_payload.capture_region {
            command
                .arg("-offset_x")
                .arg(format!("{}", region.x))
                .arg("-offset_y")
                .arg(format!("{}", region.y))
                .arg("-video_size")
                .arg(format!("{}x{}", region.width.max(1), region.height.max(1)));
        }
    }

    let (video_codec, preset, extra_encoder_args): (&str, &str, Vec<&str>) = match start_payload.video.codec.as_str() {
        "h264_nvenc" => ("h264_nvenc", "p2", vec!["-tune", "ll", "-rc", "vbr", "-cq", "27"]),
        "hevc_nvenc" => ("hevc_nvenc", "p2", vec!["-tune", "ll", "-rc", "vbr", "-cq", "29"]),
        _ => ("libx264", "ultrafast", vec!["-tune", "zerolatency"]),
    };

    if start_payload.source.source_type == "screen" {
        command.arg("-i").arg("desktop");
    } else if start_payload.source.source_type == "window" {
        let window_name = start_payload.source.name.clone().unwrap_or_default();
        if window_name.trim().is_empty() {
            return Response {
                id,
                ok: false,
                payload: None,
                error: Some("window capture requires source.name in payload".to_string()),
            };
        }
        command.arg("-i").arg(format!("title={window_name}"));
    } else {
        return Response {
            id,
            ok: false,
            payload: None,
            error: Some("unsupported source type".to_string()),
        };
    }

    if needs_scale {
        command
            .arg("-vf")
            .arg(format!("scale={}x{}", start_payload.video.width, start_payload.video.height));
    }

    command
        .arg("-r")
        .arg(format!("{}", start_payload.video.fps))
        .arg("-pix_fmt")
        .arg("yuv420p")
        .arg("-b:v")
        .arg(bitrate.as_str())
        .arg("-maxrate")
        .arg(bitrate.as_str())
        .arg("-bufsize")
        .arg(format!("{}", start_payload.video.bitrate.saturating_mul(3)))
        .arg("-g")
        .arg(format!("{}", (start_payload.video.fps.max(1)) * 2))
        .arg("-movflags")
        .arg("+faststart");

    command
        .arg("-c:v")
        .arg(video_codec)
        .arg("-preset")
        .arg(preset);

    for arg in extra_encoder_args {
        command.arg(arg);
    }

    command
        .arg(output_path.as_str())
        .stdin(Stdio::piped())
        .stdout(Stdio::null())
        .stderr(Stdio::null());

    let child = match command.spawn() {
        Ok(c) => c,
        Err(err) => {
            return Response {
                id,
                ok: false,
                payload: None,
                error: Some(format!("failed to spawn ffmpeg: {err}")),
            };
        }
    };

    *active_capture = Some(ActiveCapture {
        session_id: start_payload.session_id,
        output_path: output_path.clone(),
        width: start_payload.video.width,
        height: start_payload.video.height,
        fps: start_payload.video.fps,
        started_at: Instant::now(),
        child,
    });

    Response {
        id,
        ok: true,
        payload: Some(json!({
            "status": "recording",
            "outputPath": output_path,
        })),
        error: None,
    }
}

fn handle_stop<'a>(
    id: &'a str,
    payload: Value,
    active_capture: &mut Option<ActiveCapture>,
) -> Response<'a> {
    let stop_payload: StopCapturePayload = match serde_json::from_value(payload) {
        Ok(v) => v,
        Err(err) => {
            return Response {
                id,
                ok: false,
                payload: None,
                error: Some(format!("invalid stop_capture payload: {err}")),
            };
        }
    };

    let mut capture = match active_capture.take() {
        Some(v) => v,
        None => {
            return Response {
                id,
                ok: false,
                payload: None,
                error: Some("capture is not running".to_string()),
            };
        }
    };

    if capture.session_id != stop_payload.session_id {
        *active_capture = Some(capture);
        return Response {
            id,
            ok: false,
            payload: None,
            error: Some("sessionId mismatch".to_string()),
        };
    }

    if let Some(stdin) = capture.child.stdin.as_mut() {
        let _ = stdin.write_all(b"q\n");
        let _ = stdin.flush();
    }

    let wait_deadline = Instant::now() + Duration::from_secs(8);
    loop {
        match capture.child.try_wait() {
            Ok(Some(_status)) => break,
            Ok(None) => {
                if Instant::now() >= wait_deadline {
                    let _ = capture.child.kill();
                    let _ = capture.child.wait();
                    break;
                }
                thread::sleep(Duration::from_millis(60));
            }
            Err(_) => break,
        }
    }

    let duration_ms = capture.started_at.elapsed().as_millis() as u64;
    let bytes = std::fs::metadata(&capture.output_path)
        .map(|m| m.len())
        .unwrap_or(0);

    Response {
        id,
        ok: true,
        payload: Some(json!({
            "outputPath": capture.output_path,
            "durationMs": duration_ms,
            "width": capture.width,
            "height": capture.height,
            "fpsActual": capture.fps,
            "bytes": bytes,
        })),
        error: None,
    }
}

fn resolve_ffmpeg_path(preferred: Option<&str>) -> Option<String> {
    if let Some(path) = preferred {
        if Path::new(path).exists() {
            return Some(path.to_string());
        }
    }

    let candidate = if cfg!(target_os = "windows") {
        "ffmpeg.exe"
    } else {
        "ffmpeg"
    };

    let probe = Command::new(candidate)
        .arg("-version")
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status();

    if probe.is_ok() {
        Some(candidate.to_string())
    } else {
        None
    }
}
