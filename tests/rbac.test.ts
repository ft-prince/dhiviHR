import { describe, it, expect } from "vitest";
import { canAccess, hasRole } from "@/lib/auth/rbac";

describe("rbac.canAccess", () => {
  it("public routes open to anyone", () => {
    expect(canAccess(undefined, "/")).toBe(true);
    expect(canAccess(undefined, "/about")).toBe(true);
  });

  it("dashboard requires any authenticated user", () => {
    expect(canAccess(undefined, "/dashboard")).toBe(false);
    expect(canAccess("student", "/dashboard")).toBe(true);
    expect(canAccess("college_student", "/dashboard")).toBe(true);
    expect(canAccess("client_admin", "/dashboard")).toBe(true);
  });

  it("/admin requires client_admin or super_admin", () => {
    expect(canAccess("student", "/admin")).toBe(false);
    expect(canAccess("client_admin", "/admin")).toBe(true);
    expect(canAccess("super_admin", "/admin/users")).toBe(true);
  });

  it("/super requires super_admin", () => {
    expect(canAccess("client_admin", "/super")).toBe(false);
    expect(canAccess("super_admin", "/super/analytics")).toBe(true);
  });
});

describe("rbac.hasRole", () => {
  it("respects role hierarchy", () => {
    expect(hasRole("super_admin", "client_admin")).toBe(true);
    expect(hasRole("client_admin", "super_admin")).toBe(false);
    expect(hasRole("student", "student")).toBe(true);
    expect(hasRole(undefined, "student")).toBe(false);
  });
});
