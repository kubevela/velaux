declare namespace API {
  export type ApplicationType = {
    name: string;
    desc?: string;
    updatedAt: number;
    env?: string;
    services?: { [key: string]: any }; // components
  };

  export type EnvironmentType = {
    name: string;
    desc?: string;
    updatedAt: number;
    config?: ConfigType;
    clusters?: ClusterRef[];
    packages?: PackageRef[];
  };

  export type CapabilityType = {
    name: string;
    desc?: string;
    type: string;
    jsonschema: string;
  };

  export type ClusterType = {
    name: string;
    desc?: string;
    updatedAt: number;
    kubeconfig?: string;
  };

  export type CatalogType = {
    id?: string;
    name: string;
    desc?: string;
    updatedAt: number;
    url?: string;
    rootdir?: string;
  };

  export type ListApplicationsResponse = {
    apps: ApplicationType[];
  };
  export type ApplicationResponse = {
    app: ApplicationType;
  };

  export type ListCapabilitiesResponse = {
    capabilities: CapabilityType[];
  };

  export type ListEnvironmentsResponse = {
    environments: EnvironmentType[];
  };

  export type EnvironmentResponse = {
    environment: EnvironmentType;
  };

  export type ConfigType = {
    patch?: object;
  };

  export type ClusterRef = {
    name: string;
  };

  export type PackageRef = {
    catalog: string;
    package: string;
    version: string;
  };

  export type ListClustersResponse = {
    clusters: ClusterType[];
  };
  export type ClusterResponse = {
    cluster: ClusterType;
  };

  export type ListCatalogsResponse = {
    catalogs: CatalogType[];
  };
  export type ListPackagesResponse = {
    packages: PackageType[];
  };

  export type PackageType = {
    name: string;
    description?: string;
    labels?: string[];
    versions: PackageVersionType[];
  };

  export type PackageVersionType = {
    version: string;
    modules?: PackageModuleType[];
  };

  export type PackageModuleType = {
    helm: any;
    native: any;
  };

  export type CurrentUser = {
    avatar?: string;
    name?: string;
    title?: string;
    group?: string;
    signature?: string;
    tags?: {
      key: string;
      label: string;
    }[];
    userid?: string;
    access?: 'user' | 'guest' | 'admin';
    unreadCount?: number;
  };

  export type LoginStateType = {
    status?: 'ok' | 'error';
    type?: string;
  };

  export type NoticeIconData = {
    id: string;
    key: string;
    avatar: string;
    title: string;
    datetime: string;
    type: string;
    read?: boolean;
    description: string;
    clickClose?: boolean;
    extra: any;
    status: string;
  };
}
