import cookie from 'react-cookies';

export function setData(key: string, value: string, expire?: Date) {
  cookie.save(key, value, { expires: expire });
}

export function getData(key: string) {
  return cookie.load(key);
}
