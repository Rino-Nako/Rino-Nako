import type { StructInit } from "@yume-chan/struct";
import { extend, s32 } from "@yume-chan/struct";

import type { ScrcpyScrollController } from "../../base/index";
import type { ScrcpyInjectScrollControlMessage } from "../../latest";

import { PrevImpl } from "./prev";

export const InjectScrollControlMessage = extend(
    PrevImpl.InjectScrollControlMessage,
    { buttons: s32 },
);

export type InjectScrollControlMessage = StructInit<
    typeof InjectScrollControlMessage
>;

export class ScrollController extends PrevImpl.ScrollController {
    override serializeScrollMessage(
        message: ScrcpyInjectScrollControlMessage,
    ): Uint8Array | undefined {
        const processed = this.processMessage(message);
        if (!processed) {
            return undefined;
        }

        return InjectScrollControlMessage.serialize(processed);
    }
}

export function createScrollController(): ScrcpyScrollController {
    return new ScrollController();
}
