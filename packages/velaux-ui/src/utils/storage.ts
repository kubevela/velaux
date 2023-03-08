const token_key = 'token';

export function getToken() {
  return localStorage.getItem(token_key) || '';
}

export function setToken(token: string | string[]) {
  if (Array.isArray(token)) {
    localStorage.setItem(token_key, token[0]);
  } else if (typeof token === 'string') {
    localStorage.setItem(token_key, token);
  }
}

export function removeToken() {
  localStorage.removeItem(token_key);
}

export function hasToken() {
  return !!getToken();
}
