// ============================================================
//  Contact DTO — matches the expected backend controller shape
//  Controller: ContactController  →  POST  api/Contact/send
// ============================================================

export interface ContactDto {
  /** Full name of the person reaching out */
  fullName: string;

  /** Business / professional e-mail address */
  email: string;

  /** Optional phone number (include country code) */
  phone: string;

  /** Company or organisation name */
  company: string;

  /** Reason for contact: Sales | Support | Partnership | Other */
  subject: string;

  /** Detailed message body */
  message: string;
}

/** Shape returned by the backend after submitting the contact form */
export interface ContactResponseDto {
  success: boolean;
  message: string;
}
