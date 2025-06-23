# Page snapshot

```yaml
- text: "[plugin:vite:esbuild] Transform failed with 1 error: /app/frontend/src/utils/network.ts:7:0: ERROR: Unexpected \"}\" /app/frontend/src/utils/network.ts:7:0 Unexpected \"}\" 5 | console.log('Internet connection check skipped.'); 6 | return true; 7 | } | ^ 8 | 9 | at failureErrorWithLog (/app/frontend/node_modules/.pnpm/esbuild@0.25.2/node_modules/esbuild/lib/main.js:1477:15) at /app/frontend/node_modules/.pnpm/esbuild@0.25.2/node_modules/esbuild/lib/main.js:756:50 at responseCallbacks.<computed> (/app/frontend/node_modules/.pnpm/esbuild@0.25.2/node_modules/esbuild/lib/main.js:623:9) at handleIncomingPacket (/app/frontend/node_modules/.pnpm/esbuild@0.25.2/node_modules/esbuild/lib/main.js:678:12) at Socket.readFromStdout (/app/frontend/node_modules/.pnpm/esbuild@0.25.2/node_modules/esbuild/lib/main.js:601:7) at Socket.emit (node:events:518:28) at addChunk (node:internal/streams/readable:561:12) at readableAddChunkPushByteMode (node:internal/streams/readable:512:3) at Readable.push (node:internal/streams/readable:392:5) at Pipe.onStreamRead (node:internal/stream_base_commons:189:23 Click outside, press Esc key, or fix the code to dismiss. You can also disable this overlay by setting"
- code: server.hmr.overlay
- text: to
- code: "false"
- text: in
- code: vite.config.ts
- text: .
```