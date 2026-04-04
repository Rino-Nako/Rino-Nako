import type { StructInit } from "@yume-chan/struct";
import { struct, u32, u8 } from "@yume-chan/struct";

import type {
    AndroidKeyCode,
    AndroidKeyEventAction,
    AndroidKeyEventMeta,
} from "../android/index";
import { ScrcpyControlMessageType } from "../base/index";

export const ScrcpyInjectKeyCodeControlMessage = /* #__PURE__ */ (() =>
    struct(
        {
            type: u8(ScrcpyControlMessageType.InjectKeyCode),
            action: u8<AndroidKeyEventAction>(),
            keyCode: u32<AndroidKeyCode>(),
            repeat: u32,
            metaState: u32<AndroidKeyEventMeta>(),
        },
        { littleEndian: false },
    ))();

export type ScrcpyInjectKeyCodeControlMessage = StructInit<
    typeof ScrcpyInjectKeyCodeControlMessage
>;
