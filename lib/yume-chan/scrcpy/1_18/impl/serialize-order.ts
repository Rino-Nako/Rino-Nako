import type { Init } from "./init";
import { PrevImpl } from "./prev";

export const SerializeOrder = /* #__PURE__ */ (() =>
    [
        ...PrevImpl.SerializeOrder,
        "powerOffOnClose",
    ] as const satisfies readonly (keyof Init)[])();
