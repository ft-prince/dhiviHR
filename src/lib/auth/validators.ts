import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  stream: z.string().min(2).optional(),
  password: z.string().min(8),
  phone: z.string().optional(),
});

export const studentSignupSchema = signupSchema.extend({
  accessCode: z.string().min(4),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export function validateSignupInput(input: unknown) {
  return signupSchema.safeParse(input);
}
export function validateStudentSignupInput(input: unknown) {
  return studentSignupSchema.safeParse(input);
}
