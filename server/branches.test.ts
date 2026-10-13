import { describe, expect, it } from "vitest";
import { normalizeBranchInput } from "./db";

describe("branch insert mapping", () => {
  it("maps the form payload to the live branches columns", () => {
    expect(
      normalizeBranchInput({
        name: "  Rongai QA Branch  ",
        location: " Rongai, Nairobi ",
        phone: " +254 712 345 678 ",
      })
    ).toEqual({
      name: "Rongai QA Branch",
      location: "Rongai, Nairobi",
      phone: "+254 712 345 678",
      manager: null,
    });
  });

  it("rejects blank branch names before touching the database", () => {
    expect(() => normalizeBranchInput({ name: "   " })).toThrow(
      "Branch name is required"
    );
  });
});
