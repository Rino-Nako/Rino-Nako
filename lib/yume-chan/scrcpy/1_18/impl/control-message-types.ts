import { ScrcpyControlMessageType } from "../../base/index";

import { PrevImpl } from "./prev";

export const ControlMessageTypes: readonly ScrcpyControlMessageType[] =
    /* #__PURE__ */ (() => {
        const result = PrevImpl.ControlMessageTypes.slice();
        result.splice(6, 0, ScrcpyControlMessageType.ExpandSettingPanel);
        return result;
    })();
