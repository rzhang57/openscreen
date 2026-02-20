import { existsSync, mkdirSync, statSync, copyFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { createRequire } from "node:module";

const root = process.cwd();
const sidecarDir = path.join(root, "native-capture-sidecar");
const targetExe = path.join(sidecarDir, "target", "release", "native-capture-sidecar.exe");
const binDir = path.join(sidecarDir, "bin", "win32");
const binExe = path.join(binDir, "native-capture-sidecar.exe");
const ffmpegExe = path.join(binDir, "ffmpeg.exe");
const sourceMain = path.join(sidecarDir, "src", "main.rs");
const strictMode = process.argv.includes("--strict");

if (process.platform !== "win32") {
  process.exit(0);
}

mkdirSync(binDir, { recursive: true });

if (shouldBuildSidecar()) {
  const cargo = spawnSync("cargo", ["build", "--manifest-path", path.join("native-capture-sidecar", "Cargo.toml"), "--release"], {
    cwd: root,
    stdio: "inherit",
    shell: true,
  });
  if (cargo.status !== 0) {
    const message = "[native-capture] Sidecar build failed.";
    if (strictMode) {
      console.error(`${message} Failing because --strict is enabled.`);
      process.exit(1);
    }
    console.warn(`${message} App will fall back to legacy recorder.`);
    process.exit(0);
  }
}

if (existsSync(targetExe)) {
  copyFileSync(targetExe, binExe);
}

try {
  const require = createRequire(import.meta.url);
  const installer = require("@ffmpeg-installer/ffmpeg");
  const bundledPath = installer?.path;
  if (typeof bundledPath === "string" && existsSync(bundledPath)) {
    copyFileSync(bundledPath, ffmpegExe);
    console.info(`[native-capture] Using bundled ffmpeg from @ffmpeg-installer/ffmpeg: ${bundledPath}`);
  }
} catch {
  // Optional dependency path resolution failed; continue with PATH fallback.
}

if (!existsSync(ffmpegExe)) {
  const where = spawnSync("where", ["ffmpeg"], { cwd: root, encoding: "utf8", shell: true });
  if (where.status === 0 && where.stdout) {
    const first = where.stdout.split(/\r?\n/).map(s => s.trim()).find(Boolean);
    if (first && existsSync(first)) {
      copyFileSync(first, ffmpegExe);
      console.info(`[native-capture] Using ffmpeg from PATH: ${first}`);
    }
  }
}

if (!existsSync(ffmpegExe)) {
  const message = "[native-capture] ffmpeg.exe not available from @ffmpeg-installer/ffmpeg or PATH.";
  if (strictMode) {
    console.error(`${message} Failing because --strict is enabled.`);
    process.exit(1);
  }
  console.warn(`${message} Native capture may fall back to legacy.`);
}

function shouldBuildSidecar() {
  if (!existsSync(targetExe)) return true;
  if (!existsSync(sourceMain)) return false;
  try {
    const sourceTime = statSync(sourceMain).mtimeMs;
    const targetTime = statSync(targetExe).mtimeMs;
    return sourceTime > targetTime;
  } catch {
    return true;
  }
}
