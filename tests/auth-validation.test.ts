import { describe, it, expect } from "vitest";
import { validateSignupInput, validateStudentSignupInput } from "@/lib/auth/validators";

describe("signup validation", () => {
  it("accepts a valid public signup", () => {
    const res = validateSignupInput({
      name: "Asha Mehta",
      email: "asha@example.com",
      password: "supersecret",
    });
    expect(res.success).toBe(true);
  });

  it("rejects short passwords", () => {
    const res = validateSignupInput({ name: "A B", email: "a@b.co", password: "short" });
    expect(res.success).toBe(false);
  });

  it("rejects bad emails", () => {
    const res = validateSignupInput({ name: "A B", email: "not-an-email", password: "longenough" });
    expect(res.success).toBe(false);
  });

  it("rejects 1-char names", () => {
    const res = validateSignupInput({ name: "A", email: "a@b.co", password: "longenough" });
    expect(res.success).toBe(false);
  });
});

describe("student signup validation", () => {
  it("requires an access code", () => {
    const res = validateStudentSignupInput({
      name: "Asha",
      email: "asha@example.com",
      password: "supersecret",
      accessCode: "",
    });
    expect(res.success).toBe(false);
  });

  it("accepts when code present", () => {
    const res = validateStudentSignupInput({
      name: "Asha",
      email: "asha@example.com",
      password: "supersecret",
      accessCode: "DH-ABC123",
    });
    expect(res.success).toBe(true);
  });
});
