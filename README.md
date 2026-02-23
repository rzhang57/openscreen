# velocity
opensource screen recording. built to deliver beautiful, smooth videos quickly. a free alternative to screen studio, loom, cap. created with hackathon, startup, product demos in mind.

<img src="https://github.com/user-attachments/assets/477f39a8-1f50-43c6-b24b-47e8f42045ad" width="700" alt="demo recording">

## installation
official alpha releases found under [releases](https://github.com/rzhang57/velocity/releases). 

### note: macos
if prompted with `velocity is damaged and can't be opened. You should move it to the Trash`, run

```xattr -cr /Applications/velocity.app``` in terminal.

## stack
- TypeScript
- Electron
- React
- Rust

## current features
- record screen (or a specific window), microphone input, and your webcam simultaneously, also includes:
  - smooth custom cursor movement
  - encoder
  - quality preset (resolution)
  - framerate
  - automatic zoom in/out animations created at recording time based on input telemetry
- built in editor allowing you to:
  - adjust automatic focus animation intensity (regeneration)
  - manually add smooth zoom in/out animations with adjustable duration, position, depth
  - crop viewable video area
  - add custom backgrounds
  - trim recordings
  - adjust webcam viewable timestamps
  - add annotations (text, arrows, images)
- export final edit to different resolutions, formats
  - up to 4k 120FPS

## soon
- bug fixes
- improved editor
- custom user imported cursors

## getting started
for development: ```npm run dev```

## credit/ shoutout
this repo is a fork of the original project, openscreen, by [siddharthvaddem](https://github.com/siddharthvaddem/openscreen), which served as a strong initial foundation for the project. check it out!

## license
this project is licensed under the [MIT License](./LICENSE). by using this software, you agree that the authors are not liable for any issues, damages, or claims arising from its use.
