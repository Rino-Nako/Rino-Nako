import { describe, it } from "node:test";

import { DuplexStreamFactory } from "./duplex";
import { ReadableStream } from "./stream";

describe("DuplexStreamFactory", () => {
    it("should close all readable", async () => {
        const factory = new DuplexStreamFactory();
        const readable = factory.wrapReadable(new ReadableStream());
        const reader = readable.getReader();
        await factory.close();
        await reader.closed;
    });
});
