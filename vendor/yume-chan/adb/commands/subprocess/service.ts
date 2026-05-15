import type { Adb } from "../../adb";
import { AdbFeature } from "../../features";

import { AdbNoneProtocolSubprocessService } from "./none/index";
import { AdbShellProtocolSubprocessService } from "./shell/index";

export class AdbSubprocessService {
    readonly #adb: Adb;
    get adb() {
        return this.#adb;
    }

    readonly #noneProtocol: AdbNoneProtocolSubprocessService;
    get noneProtocol(): AdbNoneProtocolSubprocessService {
        return this.#noneProtocol;
    }

    readonly #shellProtocol?: AdbShellProtocolSubprocessService;
    get shellProtocol(): AdbShellProtocolSubprocessService | undefined {
        return this.#shellProtocol;
    }

    constructor(adb: Adb) {
        this.#adb = adb;

        this.#noneProtocol = new AdbNoneProtocolSubprocessService(adb);

        if (adb.canUseFeature(AdbFeature.ShellV2)) {
            this.#shellProtocol = new AdbShellProtocolSubprocessService(adb);
        }
    }
}
