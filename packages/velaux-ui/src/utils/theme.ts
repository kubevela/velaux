// isLight reports whether a hex colour is pale enough for dark text on it,
// by its relative luminance.
export function isLight(hex: string): boolean {
  let h = hex.replace('#', '');
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4;
}

// rgba writes a hex colour with an alpha.
function rgba(hex: string, alpha: number): string {
  let h = hex.replace('#', '');
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// sidebarTheme is the sidebar's palette for a background and accent, as CSS
// variables. Text is dark on a pale background and light on a dark one; with
// no background the stylesheet's dark defaults stand.
export function sidebarTheme(background?: string, accent?: string): Record<string, string> {
  if (!background) {
    return accent ? { '--sb-accent': accent, '--sb-active': rgba(accent, 0.16) } : {};
  }
  const light = isLight(background);
  const theme: Record<string, string> = light
    ? {
        '--sb-bg': background,
        '--sb-text': '#334155',
        '--sb-text-strong': '#0f172a',
        '--sb-muted': '#64748b',
        '--sb-hover': 'rgba(15, 23, 42, 0.06)',
        '--sb-border': 'rgba(15, 23, 42, 0.08)',
      }
    : {
        '--sb-bg': background,
        '--sb-text': '#a3adbd',
        '--sb-text-strong': '#f1f5f9',
        '--sb-muted': '#64748b',
        '--sb-hover': 'rgba(255, 255, 255, 0.06)',
        '--sb-border': 'rgba(255, 255, 255, 0.06)',
      };
  if (accent) {
    theme['--sb-accent'] = accent;
    theme['--sb-active'] = rgba(accent, light ? 0.14 : 0.2);
    theme['--sb-active-text'] = light ? accent : '#f1f5f9';
  }
  return theme;
}
