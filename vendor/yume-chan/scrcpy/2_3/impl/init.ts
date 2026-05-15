import type { PrevImpl } from "./prev";

export interface Init<TVideo extends boolean>
    extends Omit<PrevImpl.Init<TVideo>, "audioCodec"> {
    audioCodec?: PrevImpl.Init<TVideo>["audioCodec"] | "flac";
}
