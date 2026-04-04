import type { Init } from "./init";
import { PrevImpl } from "./prev";

export const Defaults = /* #__PURE__ */ (() =>
    ({
        ...PrevImpl.Defaults,
        vdDestroyContent: false,
    }) as const satisfies Init<true>)();
