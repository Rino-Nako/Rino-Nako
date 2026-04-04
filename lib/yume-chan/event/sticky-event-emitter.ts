import type { EventListenerInfo } from "./event-emitter";
import { EventEmitter } from "./event-emitter";
import type { RemoveEventListener } from "./event";

const Undefined = Symbol("undefined");

export class StickyEventEmitter<TEvent, TResult = unknown> extends EventEmitter<
    TEvent,
    TResult
> {
    #value: TEvent | typeof Undefined = Undefined;

    protected override addEventListener(
        info: EventListenerInfo<TEvent, TResult>,
    ): RemoveEventListener {
        if (this.#value !== Undefined) {
            info.listener.call(info.thisArg, this.#value, ...info.args);
        }
        return super.addEventListener(info);
    }

    override fire(e: TEvent): void {
        this.#value = e;
        super.fire(e);
    }
}
