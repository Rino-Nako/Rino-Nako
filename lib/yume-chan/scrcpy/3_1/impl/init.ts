import type { PrevImpl } from "./prev";

export interface Init<TVideo extends boolean> extends PrevImpl.Init<TVideo> {
    vdDestroyContent?: boolean;
}
