"use server";

import { z } from "zod";
import { ilike, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { colleges, enquiries } from "@/lib/db/schema";

/* ─── College search (autocomplete source for the enquiry form) ─── */
export interface CollegeOption {
  id: string;
  name: string;
  location: string | null;
}

export async function searchCollegesAction(query: string): Promise<CollegeOption[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const rows = await db
    .select({ id: colleges.id, name: colleges.name, location: colleges.location })
    .from(colleges)
    .where(ilike(colleges.name, `%${q}%`))
    .orderBy(asc(colleges.name))
    .limit(8);

  return rows;
}

/* ─── Enquiry submission ───────────────────────────────────────── */
const INTEREST_VALUES = ["crafte", "expert_talks", "other"] as const;

const enquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name."),
  designation: z.string().trim().max(120).optional().or(z.literal("")),
  collegeId: z.string().uuid().optional().or(z.literal("")),
  collegeName: z.string().trim().min(2, "Please enter your college or institution."),
  location: z.string().trim().max(160).optional().or(z.literal("")),
  email: z.string().trim().email("Please enter a valid email address."),
  mobile: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Mobile number must be exactly 10 digits."),
  interests: z.array(z.enum(INTEREST_VALUES)).min(1, "Please select at least one option."),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;
export type EnquiryResult = { ok: true } | { ok: false; error: string };

export async function submitEnquiryAction(input: EnquiryInput): Promise<EnquiryResult> {
  const parsed = enquirySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const data = parsed.data;

  try {
    await db.insert(enquiries).values({
      name: data.name,
      designation: data.designation || null,
      collegeId: data.collegeId || null,
      collegeName: data.collegeName,
      location: data.location || null,
      email: data.email,
      mobile: data.mobile,
      interests: data.interests,
      message: data.message || null,
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
