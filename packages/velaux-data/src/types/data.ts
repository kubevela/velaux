export type KeyValue<T = any> = Record<string, T>;

export function unmarshal<T>(kv: KeyValue): T {
  return kv as T;
}

export function marshal<T>(obj: T): KeyValue {
  return obj as KeyValue;
}
