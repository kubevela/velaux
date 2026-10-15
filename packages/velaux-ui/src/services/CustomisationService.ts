import type { Terminology } from '../utils/terminology';
import { applyTerminology } from '../utils/terminology';
import { sidebarTheme } from '../utils/theme';

// Customisation is how this VelaUX is branded, kept in the vela-system
// velaux-configuration ConfigMap.
export interface Customisation {
  // pageTitle is the browser tab's title.
  pageTitle?: string;
  logoURL?: string;
  iconURL?: string;
  // sidebarColor and accentColor are hex colours for the sidebar's background
  // and its current page and highlights.
  sidebarColor?: string;
  accentColor?: string;
  terminology?: Terminology;
}

type Listener = (c: Customisation) => void;

// iconLink is the page's tab icon.
function iconLink(): HTMLLinkElement | null {
  return document.querySelector('link[rel~="icon"]');
}

// customisationService holds the branding read from the server: the logo, and
// the terminology every translated string passes through. It imports no API
// code, as i18n reads it and the request layer imports i18n.
class CustomisationService {
  private current: Customisation = {};
  private listeners: Listener[] = [];
  // defaultTitle is the tab's title as the page set it.
  private defaultTitle = typeof document !== 'undefined' ? document.title : '';
  // rootTheme is the sidebar's colours as last set on the page root.
  private rootTheme: Record<string, string> = {};
  // defaultIcon is the tab's icon as the page set it.
  private defaultIcon = typeof document !== 'undefined' ? iconLink()?.getAttribute('href') || '' : '';

  get(): Customisation {
    return this.current;
  }

  set(c: Customisation) {
    this.current = c;
    if (typeof document !== 'undefined') {
      document.title = c.pageTitle || this.defaultTitle;
      // The sidebar's colours on the page root too, for what renders outside the
      // sidebar in them, such as a modal's header.
      const root = document.documentElement.style;
      Object.keys(this.rootTheme).forEach((k) => root.removeProperty(k));
      this.rootTheme = sidebarTheme(c.sidebarColor, c.accentColor);
      Object.entries(this.rootTheme).forEach(([k, v]) => root.setProperty(k, v));
      // The tab shows the icon the minimised sidebar does.
      const link = iconLink();
      const href = c.iconURL || this.defaultIcon;
      if (link && href) {
        link.setAttribute('href', href);
        link.removeAttribute('type');
      }
    }
    this.listeners.forEach((l) => l(c));
  }

  subscribe(l: Listener): () => void {
    this.listeners.push(l);
    return () => {
      this.listeners = this.listeners.filter((x) => x !== l);
    };
  }

  // translate renames the customised terms in a translated string.
  translate(text: string): string {
    return applyTerminology(text, this.current.terminology || {});
  }
}

export const customisationService = new CustomisationService();

// terminologyPostProcessor passes every i18next translation through the
// customised terminology.
export const terminologyPostProcessor = {
  type: 'postProcessor' as const,
  name: 'terminology',
  process: (value: string) => (typeof value === 'string' ? customisationService.translate(value) : value),
};
