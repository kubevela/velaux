import type { NameAlias } from './env';
export type User = {
  name: string;
  alias?: string;
  email?: string;
  createTime?: string;
  lastLoginTime?: string;
  enable?: boolean;
  password?: string;
  disabled?: boolean;
  roles?: NameAlias[];
};
