import type { Init } from "./init";
import { PrevImpl } from "./prev";

export const Defaults = /* #__PURE__ */ (() =>
    ({
        ...PrevImpl.Defaults,
        powerOn: true,
    }) as const satisfies Init)();
