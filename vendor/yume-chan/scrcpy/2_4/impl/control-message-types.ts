import { ScrcpyControlMessageType } from "../../base/index";

import { PrevImpl } from "./prev";

export const ControlMessageTypes: readonly ScrcpyControlMessageType[] =
    /* #__PURE__ */ (() => [
        ...PrevImpl.ControlMessageTypes,
        ScrcpyControlMessageType.UHidCreate,
        ScrcpyControlMessageType.UHidInput,
        ScrcpyControlMessageType.OpenHardKeyboardSettings,
    ])();
