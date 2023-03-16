// This module was inspired by Grafana.

import * as H from 'history';

/**
 * Type to represent the value of a single query variable.
 *
 * @public
 */
export type UrlQueryValue = string | number | boolean | string[] | number[] | boolean[] | undefined | null;

/**
 * Type to represent the values parsed from the query string.
 *
 * @public
 */
export type UrlQueryMap = Record<string, UrlQueryValue>;

function renderUrl(path: string, query: UrlQueryMap | undefined): string {
  if (query && Object.keys(query).length > 0) {
    path += '?' + toUrlParams(query);
  }
  return path;
}

function encodeURIComponent2(val: string, pctEncodeSpaces?: boolean) {
  return encodeURIComponent(val)
    .replace(/%40/gi, '@')
    .replace(/%3A/gi, ':')
    .replace(/%24/g, '$')
    .replace(/%2C/gi, ',')
    .replace(/%3B/gi, ';')
    .replace(/%20/g, pctEncodeSpaces ? '%20' : '+')
    .replace(/[!'()*]/g, function (c) {
      return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    });
}

function toUrlParams(a: any) {
  const s: any[] = [];
  const rbracket = /\[\]$/;

  const isArray = (obj: any) => {
    return Object.prototype.toString.call(obj) === '[object Array]';
  };

  const add = (k: string, v: any) => {
    v = typeof v === 'function' ? v() : v === null ? '' : v === undefined ? '' : v;
    if (typeof v !== 'boolean') {
      s[s.length] = encodeURIComponent2(k, true) + '=' + encodeURIComponent2(v, true);
    } else {
      const valueQueryPart = v ? '' : '=' + encodeURIComponent2('false', true);
      s[s.length] = encodeURIComponent2(k, true) + valueQueryPart;
    }
  };

  const buildParams = (prefix: string, obj: any) => {
    let i, len, key;

    if (prefix) {
      if (isArray(obj)) {
        for (i = 0, len = obj.length; i < len; i++) {
          if (rbracket.test(prefix)) {
            add(prefix, obj[i]);
          } else {
            buildParams(prefix, obj[i]);
          }
        }
      } else if (obj && String(obj) === '[object Object]') {
        for (key in obj) {
          buildParams(prefix + '[' + key + ']', obj[key]);
        }
      } else {
        add(prefix, obj);
      }
    } else if (isArray(obj)) {
      for (i = 0, len = obj.length; i < len; i++) {
        add(obj[i].name, obj[i].value);
      }
    } else {
      for (key in obj) {
        buildParams(key, obj[key]);
      }
    }
    return s;
  };

  return buildParams('', a).join('&');
}

export function parseKeyValue(keyValue: string) {
  const obj: any = {};
  const parts = (keyValue || '').split('&');

  for (let keyValue of parts) {
    let splitPoint: number | undefined;
    let key: string | undefined;
    let val: string | undefined | boolean;

    if (keyValue) {
      key = keyValue = keyValue.replace(/\+/g, '%20');
      splitPoint = keyValue.indexOf('=');

      if (splitPoint !== -1) {
        key = keyValue.substring(0, splitPoint);
        val = keyValue.substring(splitPoint + 1);
      }

      key = tryDecodeURIComponent(key);

      if (key !== undefined) {
        val = val !== undefined ? tryDecodeURIComponent(val as string) : true;

        let parsedVal: any;
        if (typeof val === 'string' && val !== '') {
          parsedVal = val === 'true' || val === 'false' ? val === 'true' : val;
        } else {
          parsedVal = val;
        }

        if (!obj.hasOwnProperty(key)) {
          obj[key] = isNaN(parsedVal) ? val : parsedVal;
        } else if (Array.isArray(obj[key])) {
          obj[key].push(val);
        } else {
          obj[key] = [obj[key], isNaN(parsedVal) ? val : parsedVal];
        }
      }
    }
  }

  return obj;
}

function tryDecodeURIComponent(value: string): string | undefined {
  try {
    return decodeURIComponent(value);
  } catch (e) {
    return undefined;
  }
}

/**
 * @public
 * A wrapper to help work with browser location and history
 */
export interface LocationService {
  partial: (query: Record<string, any>, replace?: boolean) => void;
  push: (location: H.Path | H.LocationDescriptor<any>) => void;
  replace: (location: H.Path | H.LocationDescriptor<any>) => void;
  reload: () => void;
  getLocation: () => H.Location;
  getHistory: () => H.History;
  getSearch: () => URLSearchParams;
  getSearchObject: () => UrlQueryMap;
  getPathName: () => string;
}

/** @internal */
export class HistoryWrapper implements LocationService {
  private readonly history: H.History;

  constructor(history?: H.History) {
    // If no history passed create an in memory one if being called from test
    this.history =
      history ||
      (process.env.NODE_ENV === 'test'
        ? H.createMemoryHistory({ initialEntries: ['/'] })
        : H.createBrowserHistory({ basename: '/' }));

    this.partial = this.partial.bind(this);
    this.push = this.push.bind(this);
    this.replace = this.replace.bind(this);
    this.getSearch = this.getSearch.bind(this);
    this.getHistory = this.getHistory.bind(this);
    this.getLocation = this.getLocation.bind(this);
  }

  getHistory() {
    return this.history;
  }

  getSearch() {
    return new URLSearchParams(this.history.location.search);
  }

  partial(query: Record<string, any>, replace?: boolean) {
    const currentLocation = this.history.location;
    const newQuery = this.getSearchObject();

    for (const key of Object.keys(query)) {
      // removing params with null | undefined
      if (query[key] === null || query[key] === undefined) {
        delete newQuery[key];
      } else {
        newQuery[key] = query[key];
      }
    }

    const updatedUrl = renderUrl(currentLocation.pathname, newQuery);

    if (replace) {
      this.history.replace(updatedUrl, this.history.location.state);
    } else {
      this.history.push(updatedUrl, this.history.location.state);
    }
  }

  push(location: H.Path | H.LocationDescriptor) {
    this.history.push(location);
  }

  replace(location: H.Path | H.LocationDescriptor) {
    this.history.replace(location);
  }

  reload() {
    const prevState = (this.history.location.state as any)?.routeReloadCounter;
    this.history.replace({
      ...this.history.location,
      state: { routeReloadCounter: prevState ? prevState + 1 : 1 },
    });
  }

  getLocation() {
    return this.history.location;
  }

  // The param key include a prefix $
  getSearchObject() {
    return locationSearchToObject(this.history.location.search);
  }

  getPathName() {
    return this.history.location.pathname;
  }
}

/**
 * @public
 * Parses a location search string to an object
 * */
export function locationSearchToObject(search: string | number): UrlQueryMap {
  let queryString = typeof search === 'number' ? String(search) : search;

  if (queryString.length > 0) {
    if (queryString.startsWith('?')) {
      return parseKeyValue(queryString.substring(1));
    }
    return parseKeyValue(queryString);
  }

  return {};
}

/**
 * @public
 */
export let locationService: LocationService = new HistoryWrapper();
