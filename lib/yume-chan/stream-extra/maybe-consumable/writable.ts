import { Consumable } from "../consumable";
import type { MaybeConsumable } from "../maybe-consumable";
import type {
    QueuingStrategy,
    WritableStreamDefaultController,
} from "../stream";
import { WritableStream } from "../stream";

import { tryConsume } from "./utils";

export interface MaybeConsumableWritableStreamSink<in T> {
    start?(
        controller: WritableStreamDefaultController,
    ): void | PromiseLike<void>;
    write?(
        chunk: T,
        controller: WritableStreamDefaultController,
    ): void | PromiseLike<void>;
    abort?(reason: unknown): void | PromiseLike<void>;
    close?(): void | PromiseLike<void>;
}

export class MaybeConsumableWritableStream<in T> extends WritableStream<
    MaybeConsumable<T>
> {
    constructor(
        sink: MaybeConsumableWritableStreamSink<T>,
        strategy?: QueuingStrategy<T>,
    ) {
        let wrappedStrategy: QueuingStrategy<MaybeConsumable<T>> | undefined;
        if (strategy) {
            wrappedStrategy = {};
            if ("highWaterMark" in strategy) {
                wrappedStrategy.highWaterMark = strategy.highWaterMark;
            }
            if ("size" in strategy) {
                wrappedStrategy.size = (chunk) => {
                    return strategy.size!(
                        chunk instanceof Consumable ? chunk.value : chunk,
                    );
                };
            }
        }

        super(
            {
                start(controller) {
                    return sink.start?.(controller);
                },
                write(chunk, controller) {
                    return tryConsume(chunk, (chunk) =>
                        sink.write?.(chunk as T, controller),
                    );
                },
                abort(reason) {
                    return sink.abort?.(reason);
                },
                close() {
                    return sink.close?.();
                },
            },
            wrappedStrategy,
        );
    }
}
