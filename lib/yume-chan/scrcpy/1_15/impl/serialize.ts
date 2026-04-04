import { toScrcpyOptionValue } from "../../base/index";

export function serialize<T>(options: T, order: readonly (keyof T)[]) {
    return order.map((key) => toScrcpyOptionValue(options[key], "-"));
}
