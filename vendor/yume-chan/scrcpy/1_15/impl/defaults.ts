import type { Init } from "./init";
import { VideoOrientation } from "./init";

export const Defaults = {
    logLevel: "debug",
    maxSize: 0,
    bitRate: 8_000_000,
    maxFps: 0,
    lockVideoOrientation: VideoOrientation.Unlocked,
    tunnelForward: false,
    crop: undefined,
    sendFrameMeta: true,
    control: true,
    displayId: 0,
    showTouches: false,
    stayAwake: false,
    codecOptions: undefined,
} as const satisfies Init;
