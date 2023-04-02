import { getLanguage } from '../utils/common';
const localeData = {
  en: {
    Timeline: {
      expand: 'Expand',
      fold: 'Fold',
    },
    Balloon: {
      close: 'Close',
    },
    Card: {
      expand: 'Expand',
      fold: 'Fold',
    },
    Dialog: {
      close: 'Close',
      ok: 'OK',
      cancel: 'Cancel',
    },
    Drawer: {
      close: 'Close',
    },
    Message: {
      closeAriaLabel: 'Close',
    },
    Pagination: {
      prev: 'Prev',
      next: 'Next',
      goTo: 'Go To',
      page: 'Page',
      go: 'Go',
      total: 'Page {current} of {total} pages.',
      labelPrev: 'Prev page, current page {current}',
      labelNext: 'Next page, current page {current}',
      inputAriaLabel: 'Please enter the page to jump to',
      selectAriaLabel: 'Please select page size',
      pageSize: 'Page Size:',
    },
    Input: {
      clear: 'Clear',
    },
    List: {
      empty: 'No Data',
    },
    Select: {
      selectPlaceholder: 'Please select',
      autoCompletePlaceholder: 'Please enter',
      notFoundContent: 'No Options',
      maxTagPlaceholder: '{selected}/{total} items have been selected.',
      selectAll: 'Select All',
    },
    Table: {
      empty: 'No Data',
      ok: 'OK',
      reset: 'Reset',
      asc: 'Asc',
      desc: 'Desc',
      expanded: 'Expanded',
      folded: 'Folded',
      filter: 'Filter',
      selectAll: 'Select All',
    },
    Upload: {
      card: {
        cancel: 'Cancel',
        delete: 'Delete',
      },
      upload: {
        delete: 'Delete',
      },
    },
    Search: {
      buttonText: 'Search',
    },
    Tag: {
      delete: 'Delete',
    },
    Switch: {
      on: 'On',
      off: 'Off',
    },
    Tab: {
      closeAriaLabel: 'Close',
    },
  },
  zh: {
    Timeline: {
      expand: '展开',
      fold: '收起',
    },
    Balloon: {
      close: '关闭',
    },
    Card: {
      expand: '展开',
      fold: '收起',
    },
    Dialog: {
      close: '关闭',
      ok: '确认',
      cancel: '取消',
    },
    Drawer: {
      close: '关闭',
    },
    Message: {
      closeAriaLabel: '关闭标签',
    },
    Pagination: {
      prev: '前一页',
      next: '下一页',
      goTo: '去往',
      page: '分页',
      go: '去',
      total: 'Page {current} of {total} pages.',
      labelPrev: '前一页, 当前页 {current}',
      labelNext: '下一页, 当前页 {current}',
      inputAriaLabel: '请输入要跳转到的页面',
      selectAriaLabel: '请选择页面展示的数量',
      pageSize: '每页显示多少条:',
    },
    Input: {
      clear: '清空',
    },
    List: {
      empty: '没有数据',
    },
    Select: {
      selectPlaceholder: '请选择',
      autoCompletePlaceholder: '请输入',
      notFoundContent: '没有可选项',
      maxTagPlaceholder: '{selected}/{total} 条目已选择.',
      selectAll: '全选',
    },
    Table: {
      empty: '没有数据',
      ok: '确认',
      reset: '重置',
      asc: '生序',
      desc: '降序',
      expanded: '展开',
      folded: '收起',
      filter: '过滤',
      selectAll: '全选',
    },
    Upload: {
      card: {
        cancel: '取消',
        delete: '删除',
      },
      upload: {
        delete: '删除',
      },
    },
    Search: {
      buttonText: '搜索',
    },
    Tag: {
      delete: '删除',
    },
    Switch: {
      on: '打开',
      off: '关闭',
    },
    Tab: {
      closeAriaLabel: '关闭',
    },
  },
};

class SingletonLocal {
  private constructor() {}
  private static instance: SingletonLocal | null = null;
  static getInstance(): SingletonLocal {
    this.instance = this.instance || new SingletonLocal();
    return this.instance;
  }
  private local: any;
  setLocal(value: any) {
    this.local = value;
  }
  getLocal() {
    return () => {
      const language = getLanguage();
      return this.local[language] ?? this.local.en;
    };
  }
}
SingletonLocal.getInstance().setLocal(localeData);
export const locale = SingletonLocal.getInstance().getLocal();
