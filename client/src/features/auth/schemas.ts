import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be between 2 and 50 characters")
      .max(50, "Name must be between 2 and 50 characters"),
    email: z.string().trim().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.confirm === data.password, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
