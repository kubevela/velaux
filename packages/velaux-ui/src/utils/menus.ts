// menuShown is whether the sidebar lists a menu item: one not built yet only
// when the customisation asks to show what is coming.
export function menuShown(menu: { comingSoon?: boolean }, customisation: { showComingSoon?: boolean }): boolean {
  return !menu.comingSoon || !!customisation.showComingSoon;
}
