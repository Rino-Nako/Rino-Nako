import type { Init } from "./init";

export function setListEncoders(options: Pick<Init, "listEncoders">): void {
    options.listEncoders = true;
}
