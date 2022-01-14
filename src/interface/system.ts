export interface SystemInfo {
  systemVersion?: {
    velaVersion: string;
    gitVersion: string;
  };
  createTime: string;
  enableCollection: boolean;
  installID: string;
}
