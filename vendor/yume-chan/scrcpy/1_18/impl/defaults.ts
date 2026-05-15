import type { Init } from "./init";
import { VideoOrientation } from "./init";
import { PrevImpl } from "./prev";

export const Defaults = /* #__PURE__ */ (() =>
    ({
        ...PrevImpl.Defaults,
        logLevel: "debug",
        lockVideoOrientation: VideoOrientation.Unlocked,
        powerOffOnClose: false,
    }) as const satisfies Init)();
