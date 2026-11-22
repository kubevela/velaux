import type { Customisation } from '../services/CustomisationService';

// Draft is what the Customisation card holds while it is edited.
export type Draft = Pick<
  Customisation,
  'pageTitle' | 'logoURL' | 'iconURL' | 'sidebarColor' | 'accentColor' | 'showComingSoon'
>;

const hex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

// Each check is the one the server makes on a save.
const checks: Record<'pageTitle' | 'logoURL' | 'iconURL' | 'sidebarColor' | 'accentColor', (v: string) => boolean> = {
  pageTitle: (v) => v.length <= 100 && !/[\r\n\t]/.test(v),
  logoURL: (v) => /^(https?:\/\/|data:image\/|\/)/.test(v),
  iconURL: (v) => /^(https?:\/\/|data:image\/|\/)/.test(v),
  sidebarColor: (v) => hex.test(v),
  accentColor: (v) => hex.test(v),
};

// previewOf is the customisation to show while a draft is edited: each draft
// value a save would accept, a cleared one as the default, and what is stored
// for the rest. Terminology stays as stored.
export function previewOf(stored: Customisation, draft: Draft): Customisation {
  const preview: Customisation = { ...stored };
  (Object.keys(checks) as (keyof typeof checks)[]).forEach((key) => {
    const value = draft[key];
    if (value === undefined) {
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      preview[key] = undefined;
    } else if (checks[key](trimmed)) {
      preview[key] = trimmed;
    }
  });
  if (draft.showComingSoon !== undefined) {
    preview.showComingSoon = draft.showComingSoon;
  }
  return preview;
}
