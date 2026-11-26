// notFoundLines are the lines the 404 page picks from, one per visit.
export const notFoundLines = [
  'Whatever was here has gone under. It may have been deleted, or the link is out of date.',
  'Looks like this one sank on deploy. It may have been deleted, or the link has drifted.',
  "Nothing's anchored here any more. It may have been deleted, renamed, or never existed.",
  'This resource went down with the ship. Check the name, or head back to your applications.',
  "We couldn't find it in this harbour. It may have been deleted, or it lives in another project.",
  "This one's lost at sea. Check the link, or head back to your applications.",
];

// pickNotFoundLine picks one of notFoundLines with the given random source.
export function pickNotFoundLine(random: () => number = Math.random): string {
  return notFoundLines[Math.floor(random() * notFoundLines.length)];
}
