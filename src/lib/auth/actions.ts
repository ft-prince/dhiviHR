"use server";

import bcrypt from "bcryptjs";
import { eq, and, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users, accessCodes } from "@/lib/db/schema";
import { signIn, signOut } from "@/lib/auth";
import { signupSchema, studentSignupSchema, loginSchema } from "./validators";
import { rateLimit, rlKey } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

export type ActionResult = { ok: true; redirectTo: string } | { ok: false; error: string };

async function clientIp() {
  const h = await headers();
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "anon"
  );
}

export async function signupAction(formData: FormData): Promise<ActionResult> {
  const ip = await clientIp();
  const rl = rateLimit(rlKey("signup", ip), 5, 60_000);
  if (!rl.ok) return { ok: false, error: "Too many attempts. Please wait a minute." };

  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { name, email, password, phone } = parsed.data;

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) return { ok: false, error: "An account with this email already exists" };

  const passwordHash = await bcrypt.hash(password, 10);
  const [created] = await db
    .insert(users)
    .values({ name, email, passwordHash, phone, role: "student" })
    .returning({ id: users.id });

  await audit({ actorId: created.id, action: "user.signup", target: created.id, meta: { role: "student" } });

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch {
    /* signIn throws NEXT_REDIRECT in some flows — swallow */
  }

  return { ok: true, redirectTo: "/dashboard" };
}

export async function studentSignupAction(formData: FormData): Promise<ActionResult> {
  const ip = await clientIp();
  const rl = rateLimit(rlKey("signup-student", ip), 5, 60_000);
  if (!rl.ok) return { ok: false, error: "Too many attempts. Please wait a minute." };

  const parsed = studentSignupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone") || undefined,
    accessCode: (formData.get("accessCode") as string)?.trim(),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { name, email, password, phone, accessCode } = parsed.data;

  const code = await db
    .select()
    .from(accessCodes)
    .where(and(eq(accessCodes.code, accessCode.toUpperCase()), isNull(accessCodes.redeemedBy)))
    .limit(1);
  if (!code[0]) return { ok: false, error: "Invalid or already-used access code" };

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) return { ok: false, error: "An account with this email already exists" };

  const passwordHash = await bcrypt.hash(password, 10);
  const inserted = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash,
      phone,
      role: "college_student",
      collegeId: code[0].collegeId,
    })
    .returning({ id: users.id });

  await db
    .update(accessCodes)
    .set({ redeemedBy: inserted[0].id, redeemedAt: new Date() })
    .where(eq(accessCodes.id, code[0].id));

  await audit({ actorId: inserted[0].id, action: "code.redeem", target: code[0].id, meta: { code: code[0].code } });

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch {
    /* noop */
  }

  return { ok: true, redirectTo: "/dashboard" };
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const ip = await clientIp();
  const rl = rateLimit(rlKey("login", ip), 10, 60_000);
  if (!rl.ok) return { ok: false, error: "Too many attempts. Please wait a minute." };

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, error: "Invalid email or password" };

  try {
    await signIn("credentials", { ...parsed.data, redirect: false });
  } catch {
    return { ok: false, error: "Invalid email or password" };
  }

  const found = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  const role = found[0]?.role;
  const redirectTo =
    role === "super_admin" ? "/super" :
    role === "client_admin" ? "/admin" :
    "/dashboard";

  return { ok: true, redirectTo };
}

export async function logoutAction() {
  await signOut({ redirect: false });
  redirect("/");
}