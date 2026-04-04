import type { ReadableStream } from "@yume-chan/stream-extra";

import type { ScrcpyVideoStream } from "../../base/video";
import { ScrcpyVideoCodecId } from "../../base/video";

import type { Init } from "./init";
import { PrevImpl } from "./prev";

export async function parseVideoStreamMetadata(
    options: Pick<Init, "sendDeviceMeta">,
    stream: ReadableStream<Uint8Array>,
): Promise<ScrcpyVideoStream> {
    if (!options.sendDeviceMeta) {
        return { stream, metadata: { codec: ScrcpyVideoCodecId.H264 } };
    } else {
        return PrevImpl.parseVideoStreamMetadata(stream);
    }
}
