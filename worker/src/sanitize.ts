// Strips control characters so a submitted field can't inject stray lines
// into the plain-text email body, and caps length so one field can't blow
// up the notification.
export function sanitizeForEmail(value: string): string {
  return value
    .replace(/[\r\n\t\x00-\x1f\x7f]+/g, " ")
    .trim()
    .slice(0, 2000);
}
