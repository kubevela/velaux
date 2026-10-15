import * as yaml from 'js-yaml';

// asManifest writes an Application the API returns without its type as a
// manifest that applies as it is: apiVersion and kind first, and no
// creationTimestamp left null by the server. YAML it cannot read is returned as
// it is.
export function asManifest(text: string): string {
  if (!text) {
    return text;
  }
  let app: any;
  try {
    app = yaml.load(text);
  } catch (e) {
    return text;
  }
  if (!app || typeof app !== 'object' || Array.isArray(app)) {
    return text;
  }
  const { apiVersion, kind, ...rest } = app;
  if (rest.metadata && rest.metadata.creationTimestamp === null) {
    delete rest.metadata.creationTimestamp;
  }
  return yaml.dump(
    { apiVersion: apiVersion || 'core.oam.dev/v1beta1', kind: kind || 'Application', ...rest },
    { lineWidth: -1, noRefs: true }
  );
}
