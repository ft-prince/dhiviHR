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

export const collegeAdminSignupSchema = z.object({
  //college details
  collegeName: z.string().min(2, "College name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  state: z.string().min(1, "Please select a state"),
  city: z.string().min(1, "Please select a city"),
  //poc details
  name: z.string().min(2, "Name must be at least 2 characters"),
  pocDesignation: z.string().min(2, "Designation must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be 10 digits").max(10),
  //auth details
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword,{
  message: "Passwords do not match",
  path: ["confirmPassword"],
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
