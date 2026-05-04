import { z } from 'zod';
import {
  CreateTicketRequestDTOPriority,
  CreateTicketRequestDTOCategory,
} from '@/api/generated/models';

/**
 * Validation schema for creating a support ticket
 * Matches backend validations in CreateTicketRequestDTO
 */
export const createTicketSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .min(5, 'Title must be at least 5 characters')
    .max(255, 'Title must be less than 255 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(50000, 'Description must be less than 50000 characters'),
  priority: z.nativeEnum(CreateTicketRequestDTOPriority, {
    required_error: 'Priority is required',
  }),
  category: z.nativeEnum(CreateTicketRequestDTOCategory, {
    required_error: 'Category is required',
  }),
});

export type CreateTicketFormData = z.infer<typeof createTicketSchema>;

