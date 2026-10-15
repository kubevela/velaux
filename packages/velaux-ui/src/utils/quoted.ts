export interface QuotedPart {
  text: string;
  quoted: boolean;
}

// splitQuoted splits a message into its plain text and its double-quoted values,
// such as the names a Kubernetes warning quotes, without the quotes. An unpaired
// quote stays in the plain text.
export function splitQuoted(message: string): QuotedPart[] {
  const parts: QuotedPart[] = [];
  const pattern = /"([^"]*)"/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(message)) !== null) {
    if (match.index > last) {
      parts.push({ text: message.slice(last, match.index), quoted: false });
    }
    parts.push({ text: match[1], quoted: true });
    last = match.index + match[0].length;
  }
  if (last < message.length) {
    parts.push({ text: message.slice(last), quoted: false });
  }
  return parts;
}
