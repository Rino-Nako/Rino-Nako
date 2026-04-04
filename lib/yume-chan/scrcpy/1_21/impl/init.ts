import type { PrevImpl } from "./prev";

export interface Init extends PrevImpl.Init {
    clipboardAutosync?: boolean;
}
