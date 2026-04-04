import type { ScrcpyScrollController } from "../../base/index";
import type { ScrcpyInjectScrollControlMessage } from "../../latest";

import { PrevImpl } from "./prev";

export class ScrollController implements ScrcpyScrollController {
    serializeScrollMessage(
        message: ScrcpyInjectScrollControlMessage,
    ): Uint8Array | undefined {
        message = {
            ...message,
            scrollX: message.scrollX / 16,
            scrollY: message.scrollY / 16,
        };
        return PrevImpl.InjectScrollControlMessage.serialize(message);
    }
}

export function createScrollController(): ScrcpyScrollController {
    return new ScrollController();
}
