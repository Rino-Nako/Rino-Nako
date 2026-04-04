import * as assert from "node:assert";
import { describe, it } from "node:test";

import { struct } from "./index";

describe("Struct", () => {
    describe("Index", () => {
        it("should export default Struct", () => {
            assert.ok(struct);
        });
    });
});
