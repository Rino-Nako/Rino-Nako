import { omit } from "../../utils/index";

import type { Init } from "./init";
import { PrevImpl } from "./prev";

export const Defaults = /* #__PURE__ */ (() =>
    ({
        ...omit(PrevImpl.Defaults, "lockVideoOrientation"),
        captureOrientation: undefined,
        angle: 0,
        screenOffTimeout: undefined,
        listApps: false,
        newDisplay: undefined,
        vdSystemDecorations: true,
    }) as const satisfies Init<true>)();
