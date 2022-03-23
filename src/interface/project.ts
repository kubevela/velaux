export interface Project {
  name: string;
  alias?: string;
  description?: string;
  createTime?: string;
  updateTime?: string;
  owner?: Owner;
}

export interface Owner {
  name: string;
  alias?: string;
}
