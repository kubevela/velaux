import i18n from '../i18n';

export default function localStore() {
  return {
    Timeline: {
      expand: i18n.t('Expand'),
      fold: i18n.t('Fold'),
    },
    Balloon: {
      close: i18n.t('Close'),
    },
    Card: {
      expand: i18n.t('Expand'),
      fold: i18n.t('Fold'),
    },
    Dialog: {
      close: i18n.t('Close'),
      ok: i18n.t('Confirm'),
      cancel: i18n.t('Cancel'),
    },
    Drawer: {
      close: i18n.t('Close'),
    },
    Message: {
      closeAriaLabel: i18n.t('Close'),
    },
    Pagination: {
      prev: i18n.t('Prev'),
      next: i18n.t('Next'),
      goTo: i18n.t('Go To'),
      page: i18n.t('Page'),
      go: i18n.t('Go'),
      total: i18n.t('Page {current} of {total} pages.'),
      labelPrev: i18n.t('Prev page, current page {current}'),
      labelNext: i18n.t('Next page, current page {current}'),
      inputAriaLabel: i18n.t('Please enter the page to jump to'),
      selectAriaLabel: i18n.t('Please select page size'),
      pageSize: i18n.t('Page Size:'),
    },
    Input: {
      clear: i18n.t('Clear'),
    },
    List: {
      empty: i18n.t('No Data'),
    },
    Select: {
      selectPlaceholder: i18n.t('Please select'),
      autoCompletePlaceholder: i18n.t('Please enter'),
      notFoundContent: i18n.t('No Options'),
      maxTagPlaceholder: i18n.t('{selected}/{total} items have been selected.'),
      selectAll: i18n.t('Select All'),
    },
    Table: {
      empty: i18n.t('No Data'),
      ok: i18n.t('Confirm'),
      reset: i18n.t('Reset'),
      asc: i18n.t('Asc'),
      desc: i18n.t('Desc'),
      expanded: i18n.t('Expanded'),
      folded: i18n.t('folded'),
      filter: i18n.t('Filter'),
      selectAll: i18n.t('Select All'),
    },
    Upload: {
      card: {
        cancel: i18n.t('Cancel'),
        delete: i18n.t('Delete'),
      },
      upload: {
        delete: i18n.t('Delete'),
      },
    },
    Search: {
      buttonText: i18n.t('Search'),
    },
    Tag: {
      delete: i18n.t('Delete'),
    },
    Switch: {
      on: i18n.t('On'),
      off: i18n.t('Off'),
    },
    Tab: {
      closeAriaLabel: i18n.t('Close'),
    },
  };
}
