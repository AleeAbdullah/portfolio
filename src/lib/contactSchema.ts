import { z } from "zod";

export const roles = [
  "Owner/Founder",
  "CEO",
  "Marketer",
  "Product Manager",
  "Operations Manager",
  "Sales Manager",
  "Others",
] as const;

export const budgets = [
  "Under 10K",
  "10k - 50k",
  "50k - 200k",
  "200k - 500k",
  "More than 500k",
] as const;

export const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  companyName: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
  role: z.enum(roles).refine((val) => val !== undefined, {
    message: "Please select your role",
  }),
  roleOther: z.string().optional(),
  projectDescription: z.string().min(10, "Please provide more details about your project"),
  budget: z.enum(budgets).refine((val) => val !== undefined, {
    message: "Please select your budget range",
  }),
  attachment: z.any().optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;

