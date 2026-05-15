import { ScrcpyControlMessageType } from "../../base/index";

import { PrevImpl } from "./prev";

export const ControlMessageTypes: readonly ScrcpyControlMessageType[] =
    /* #__PURE__ */ (() => {
        const result = PrevImpl.ControlMessageTypes.slice();
        result.splice(14, 0, ScrcpyControlMessageType.UHidDestroy);
        return result;
    })();
