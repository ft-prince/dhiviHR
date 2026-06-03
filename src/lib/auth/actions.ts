"use server";

import bcrypt from "bcryptjs";
import { eq, and, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users, accessCodes, streams } from "@/lib/db/schema";
import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";
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
    stream: formData.get("stream") || undefined,
    password: formData.get("password"),
    phone: formData.get("phone") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { name, email, password, phone, stream } = parsed.data;

  if(!stream) return { ok: false, error: "Stream is required" };

  const existingStream = await db.select().from(streams).where(eq(streams.id, stream)).limit(1);
  if (!existingStream[0]) return { ok: false, error: "Invalid stream" };

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) return { ok: false, error: "An account with this email already exists" };

  const passwordHash = await bcrypt.hash(password, 10);
  const [created] = await db
    .insert(users)
    .values({ name, email, passwordHash, phone, role: "student", streamId: existingStream[0].id })
    .returning({ id: users.id });

  await audit({ actorId: created.id, action: "user.signup", target: created.id, meta: { role: "student" } });

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "Auto-login failed. Please log in manually." };
    }
    throw error;
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
    stream: formData.get("stream") || undefined,
    password: formData.get("password"),
    phone: formData.get("phone") || undefined,
    accessCode: (formData.get("accessCode") as string)?.trim(),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { name, email, password, phone, accessCode, stream } = parsed.data;

  if(!stream) return { ok: false, error: "Stream is required" };

  const existingStream = await db.select().from(streams).where(eq(streams.id, stream)).limit(1);
  if (!existingStream[0]) return { ok: false, error: "Invalid stream" };

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
      streamId: existingStream[0].id,
    })
    .returning({ id: users.id });

  await db
    .update(accessCodes)
    .set({ redeemedBy: inserted[0].id, redeemedAt: new Date() })
    .where(eq(accessCodes.id, code[0].id));

  await audit({ actorId: inserted[0].id, action: "code.redeem", target: code[0].id, meta: { code: code[0].code } });

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "Auto-login failed. Please log in manually." };
    }
    throw error;
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
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "Invalid email or password" };
    }
    throw error;
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

export async function getStreamsForAccessCodeAction(accessCode: string) {
  const trimmed = accessCode.trim().toUpperCase();
  if (!trimmed) return [];

  const [code] = await db
    .select({ collegeId: accessCodes.collegeId })
    .from(accessCodes)
    .where(and(eq(accessCodes.code, trimmed), isNull(accessCodes.redeemedBy)))
    .limit(1);

  if (!code) return [];

  return db
    .select({ id: streams.id, name: streams.name })
    .from(streams)
    .where(eq(streams.collegeId, code.collegeId));
}