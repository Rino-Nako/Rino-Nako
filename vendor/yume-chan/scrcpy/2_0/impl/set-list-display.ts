import type { Init } from "./init";

export function setListDisplays(options: Pick<Init, "listDisplays">): void {
    options.listDisplays = true;
}
