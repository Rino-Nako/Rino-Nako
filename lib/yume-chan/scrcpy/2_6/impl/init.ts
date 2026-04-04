import type { PrevImpl } from "./prev";

export interface Init<TVideo extends boolean>
    extends Omit<PrevImpl.Init<TVideo>, "audioSource"> {
    audioSource?: PrevImpl.Init<TVideo>["audioSource"] | "playback";
    audioDup?: boolean;
}
