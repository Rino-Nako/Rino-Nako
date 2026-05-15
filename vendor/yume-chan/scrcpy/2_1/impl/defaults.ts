import type { Init } from "./init";
import { PrevImpl } from "./prev";

export const Defaults = /* #__PURE__ */ (() =>
    ({
        ...PrevImpl.Defaults,
        video: true,
        audioSource: "output",
    }) as const satisfies Init<true>)();
