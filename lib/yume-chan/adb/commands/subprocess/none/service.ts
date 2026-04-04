import type { Adb } from "../../../adb";

import { AdbNoneProtocolProcessImpl } from "./process";
import { AdbNoneProtocolPtyProcess } from "./pty";
import { AdbNoneProtocolSpawner } from "./spawner";

export class AdbNoneProtocolSubprocessService extends AdbNoneProtocolSpawner {
    readonly #adb: Adb;
    get adb(): Adb {
        return this.#adb;
    }

    constructor(adb: Adb) {
        super(async (command, signal) => {
            // `shell,raw:${command}` also triggers raw mode,
            // But is not supported on Android version <7.
            const socket = await this.#adb.createSocket(
                `exec:${command.join(" ")}`,
            );

            if (signal?.aborted) {
                await socket.close();
                throw signal.reason;
            }

            return new AdbNoneProtocolProcessImpl(socket, signal);
        });
        this.#adb = adb;
    }

    async pty(
        command?: string | readonly string[],
    ): Promise<AdbNoneProtocolPtyProcess> {
        if (command === undefined) {
            command = "";
        } else if (Array.isArray(command)) {
            command = command.join(" ");
        }

        return new AdbNoneProtocolPtyProcess(
            // https://github.com/microsoft/typescript/issues/17002
            await this.#adb.createSocket(`shell:${command as string}`),
        );
    }
}
