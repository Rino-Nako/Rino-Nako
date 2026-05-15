import type { Init } from "./init";
import { PrevImpl } from "./prev";

export const Defaults = /* #__PURE__ */ (() =>
    ({
        ...PrevImpl.Defaults,
        videoSource: "display",
        displayId: 0,
        cameraId: undefined,
        cameraSize: undefined,
        cameraFacing: undefined,
        cameraAr: undefined,
        cameraFps: undefined,
        cameraHighSpeed: false,
        listCameras: false,
        listCameraSizes: false,
    }) as const satisfies Init<true>)();
