import type { ScrcpyInjectScrollControlMessage } from "../latest";

export interface ScrcpyScrollController {
    serializeScrollMessage(
        message: ScrcpyInjectScrollControlMessage,
    ): Uint8Array | undefined;
}
