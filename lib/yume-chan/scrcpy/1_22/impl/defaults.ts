import type { Init } from "./init";
import { PrevImpl } from "./prev";

export const Defaults = /* #__PURE__ */ (() =>
    ({
        ...PrevImpl.Defaults,
        downsizeOnError: true,
        sendDeviceMeta: true,
        sendDummyByte: true,
    }) as const satisfies Init)();
