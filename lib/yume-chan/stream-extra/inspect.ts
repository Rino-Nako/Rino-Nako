import { TransformStream } from "./stream";

export class InspectStream<T> extends TransformStream<T, T> {
    constructor(callback: (value: T) => void) {
        super({
            transform(chunk, controller) {
                callback(chunk);
                controller.enqueue(chunk);
            },
        });
    }
}
