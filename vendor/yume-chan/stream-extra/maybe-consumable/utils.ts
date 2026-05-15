import { Consumable } from "../consumable";
import type { MaybeConsumable } from "../maybe-consumable";

export function getValue<T>(value: MaybeConsumable<T>): T {
    return value instanceof Consumable ? value.value : value;
}

export function tryConsume<T, R>(
    value: T,
    callback: (value: T extends Consumable<infer U> ? U : T) => R,
): R {
    if (value instanceof Consumable) {
        return value.tryConsume(callback);
    } else {
        return callback(value as never);
    }
}
