declare global {
    interface ArrayBuffer {
        // Disallow assigning `Uint8Array` to `Arraybuffer`
        __brand: never;
    }

    interface SharedArrayBuffer {
        // Allow `SharedArrayBuffer` to be assigned to `ArrayBuffer`
        __brand: never;
    }
}

export * from "./bipedal";
export * from "./buffer";
export * from "./concat";
export * from "./extend";
export * from "./field/index";
export * from "./number";
export * from "./readable";
export * from "./string";
export * from "./struct";
export * from "./types";
export * from "./utils";
