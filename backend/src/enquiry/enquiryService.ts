import { z } from 'zod';
import type { CatalogueService } from '../catalogue/catalogueService.js';

export const enquirySchema = z.object({
  productId: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('A valid email is required').max(200),
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[+()\-\s\d]*$/, 'Phone may only contain digits, spaces and + ( ) -')
    .optional()
    .or(z.literal('')),
  message: z.string().trim().max(2000).optional().or(z.literal('')),
});

export type Enquiry = z.infer<typeof enquirySchema>;

export interface OutgoingEmail {
  to: string;
  replyTo: string;
  subject: string;
  text: string;
}

/** Any email provider (SMTP, SES, SendGrid...) just has to implement this. */
export interface EmailSender {
  send(email: OutgoingEmail): Promise<void>;
}

export class ProductNotFoundError extends Error {}

export class EnquiryService {
  constructor(
    private readonly catalogue: CatalogueService,
    private readonly mailer: EmailSender,
    private readonly salesInbox: string,
  ) {}

  async submit(enquiry: Enquiry): Promise<void> {
    const product = await this.catalogue.product(enquiry.productId);
    if (!product) throw new ProductNotFoundError(`No product ${enquiry.productId}`);

    // Plain-text email only: customer input is never interpreted as HTML.
    const lines = [
      `New enquiry for: ${product.title} (id ${product.id})`,
      `Price: $${product.price.toFixed(2)}`,
      '',
      `Name:  ${enquiry.name}`,
      `Email: ${enquiry.email}`,
      `Phone: ${enquiry.phone || '-'}`,
      '',
      'Message:',
      enquiry.message || '(none)',
    ];

    await this.mailer.send({
      to: this.salesInbox,
      replyTo: enquiry.email,
      // strip CR/LF so a product title can never inject extra headers
      subject: `Product enquiry: ${product.title}`.replace(/[\r\n]+/g, ' ').slice(0, 150),
      text: lines.join('\n'),
    });
  }
}
