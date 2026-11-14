import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatPrice } from "../src/utils/format.js";

describe("formatPrice", () => {
  it("formats centavos into Philippine Peso (PHP)", () => {
    const formatted = formatPrice(75000);
    assert.ok(formatted.includes("₱") || formatted.includes("PHP"));
    assert.ok(formatted.includes("750.00"));
  });
});
