import { omit } from "../../utils/index";

import type { Init } from "./init";
import { PrevImpl } from "./prev";

export const Defaults = /* #__PURE__ */ (() =>
    ({
        ...omit(PrevImpl.Defaults, "bitRate", "codecOptions", "encoderName"),
        scid: undefined,

        videoCodec: "h264",
        videoBitRate: 8000000,
        videoCodecOptions: undefined,
        videoEncoder: undefined,

        audio: true,
        audioCodec: "opus",
        audioBitRate: 128000,
        audioCodecOptions: undefined,
        audioEncoder: undefined,

        listEncoders: false,
        listDisplays: false,
        sendCodecMeta: true,
    }) as const satisfies Init)();
