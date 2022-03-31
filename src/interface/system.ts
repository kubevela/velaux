export interface SystemInfo {
  systemVersion?: {
    velaVersion: string;
    gitVersion: string;
  };
  createTime: string;
  enableCollection: boolean;
  loginType?: boolean;
  installID: string;
}

export interface UpdateSystemInfo {
  enableCollection: boolean;
  loginType: 'local' | 'dex';
  velaAddress: string;
}
