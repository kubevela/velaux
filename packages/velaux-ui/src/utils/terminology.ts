// Term is the singular and plural a renamed word takes.
export type Term = { singular: string; plural: string };

// Terminology renames the UI's words, keyed by the word in the singular as the
// UI writes it: Application, Environment, Cluster.
export type Terminology = Record<string, Term>;

// pluralOf is the plural the UI's own text uses for a word.
export function pluralOf(word: string): string {
  if (/[^aeiou]y$/i.test(word)) {
    return word.slice(0, -1) + 'ies';
  }
  if (/(s|x|z|ch|sh)$/i.test(word)) {
    return word + 'es';
  }
  return word + 's';
}

// matchCase writes a replacement in the case of the word it replaces.
function matchCase(found: string, replacement: string): string {
  if (found === found.toUpperCase() && found !== found.toLowerCase()) {
    return replacement.toUpperCase();
  }
  if (found[0] === found[0].toUpperCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement[0].toLowerCase() + replacement.slice(1);
}

function escape(word: string): string {
  return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// applyTerminology renames each term's singular and plural wherever they stand
// as whole words in text, in any case.
export function applyTerminology(text: string, terms: Terminology): string {
  const names = Object.keys(terms);
  if (!text || names.length === 0) {
    return text;
  }
  const words = new Map<string, string>();
  names.forEach((name) => {
    words.set(pluralOf(name).toLowerCase(), terms[name].plural);
    words.set(name.toLowerCase(), terms[name].singular);
  });
  // Longest first, so a plural is matched before the singular it contains.
  const alternatives = Array.from(words.keys())
    .sort((a, b) => b.length - a.length)
    .map(escape)
    .join('|');
  const pattern = new RegExp(`\\b(${alternatives})\\b`, 'gi');
  return text.replace(pattern, (found) => matchCase(found, words.get(found.toLowerCase()) || found));
}
