export interface PermPolicies {
  name: string;
  alias?: string;
  createTime?: string;
  updateTime?: string;
  effect?: string;
  resources?: string[];
  actions?: string[];
}
