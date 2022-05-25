import { CodeSnippet } from '@b-design/ui';
import * as React from 'react';
import { detailResource } from '../../../../api/observation';
import DrawerWithFooter from '../../../../components/Drawer';
import type { ResourceTreeNode, ResourceObject } from '../../../../interface/observation';
import * as yaml from 'js-yaml';

type ResourceProps = {
  resource: ResourceTreeNode;
  onClose: () => void;
};

function loadResource(resource: ResourceTreeNode, setResource: any) {
  if (resource.name && resource.namespace && resource.kind && resource.apiVersion) {
    detailResource({
      name: resource.name,
      namespace: resource.namespace,
      kind: resource.kind,
      apiVersion: resource.apiVersion,
      cluster: resource.cluster || 'local',
    }).then((res?: { resource: ResourceObject }) => {
      if (res && res.resource) {
        delete res.resource.metadata.managedFields;
        setResource(res.resource);
      }
    });
  }
}

export const ShowResource = (props: ResourceProps) => {
  const [resource, setResource] = React.useState<ResourceObject>();

  React.useEffect(() => {
    loadResource(props.resource, setResource);
  });

  return (
    <React.Fragment>
      <DrawerWithFooter
        title={`${props.resource.namespace}/${props.resource.kind}/${props.resource.name}`}
        placement="right"
        width={600}
        onClose={props.onClose}
      >
        <CodeSnippet code={yaml.dump(resource)} />
      </DrawerWithFooter>
    </React.Fragment>
  );
};
