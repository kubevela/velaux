// PackageBase is a CUE package a definition can import: a Package resource in
// the cluster, or one built into KubeVela.
export interface PackageBase {
  name: string;
  namespace?: string;
  // path is what a definition imports it as.
  path: string;
  builtin?: boolean;
  // usedBy names what can import a built-in package.
  usedBy?: string[];
  // variant tells apart the built-in packages that share a path.
  variant?: string;
  provider?: PackageProvider;
  functions: number;
  files: number;
  createTime?: string;
}

// PackageProvider is the external server that runs a package's functions;
// its header values are never sent.
export interface PackageProvider {
  protocol: string;
  endpoint: string;
  headers?: string[];
}

// PackageField is a field of a function's parameters or results, or of a type.
export interface PackageField {
  name: string;
  type?: string;
  optional?: boolean;
  description?: string;
  fields?: PackageField[];
}

// PackageFunction is a definition a package's provider runs.
export interface PackageFunction {
  name: string;
  do: string;
  provider?: string;
  description?: string;
  params?: PackageField[];
  paramsType?: string;
  returns?: PackageField[];
  returnsType?: string;
  usage: string;
}

export interface PackageType {
  name: string;
  description?: string;
  type?: string;
  fields?: PackageField[];
}

export interface PackageFile {
  name: string;
  content: string;
}

export interface PackageDetail extends PackageBase {
  packageName?: string;
  functionList: PackageFunction[];
  types: PackageType[];
  fileList: PackageFile[];
  issue?: string;
}
