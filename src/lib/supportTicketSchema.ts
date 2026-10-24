import { z } from "zod";
export function supportTicketSchema(message: (key: string) => string) {
  return z.object({
    name: z.string().min(2, message("support.validation.name")),
    email: z.string().email(message("support.validation.email")),
    category: z.string().min(1, message("support.validation.category")),
    subject: z.string().min(5, message("support.validation.subject")),
    message: z.string().min(20, message("support.validation.message")),
  });
}
