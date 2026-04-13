import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Required'),
  pin: z.string().length(5, 'PIN must be exactly 5 digits').regex(/^\d{5}$/, 'Digits only'),
});

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'At least 3 characters')
    .max(20, 'Max 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, underscores only'),
  pin: z.string().length(5, 'PIN must be exactly 5 digits').regex(/^\d{5}$/, 'Digits only'),
  confirmPin: z.string(),
}).refine((d) => d.pin === d.confirmPin, {
  message: "PINs don't match",
  path: ['confirmPin'],
});

export const createBetSchema = z.object({
  description: z.string().min(5, 'At least 5 characters').max(200, 'Max 200 characters'),
  minimumBet: z.number({ invalid_type_error: 'Must be a number' }).int().min(1, 'Minimum 1').max(100_000),
  options: z
    .array(z.string().min(1, 'Option cannot be empty').max(80, 'Max 80 characters'))
    .min(2, 'Need at least 2 options')
    .max(8, 'Maximum 8 options'),
});

export const wagerSchema = z.object({
  optionIndex: z.number().int().min(0),
  amount: z.number({ invalid_type_error: 'Must be a number' }).int().min(1),
});
