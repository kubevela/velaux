import * as yaml from 'js-yaml';
import * as React from 'react';
import { v4 as uuid } from 'uuid';

import { detailResource } from '../../../../api/observation';
import DefinitionCode from '../../../../components/DefinitionCode';
import DrawerWithFooter from '../../../../components/Drawer';
import Empty from '../../../../components/Empty';
import { If } from '../../../../components/If';
import type { ResourceTreeNode, ResourceObject } from '@velaux/data';

type ResourceProps = {
  resource: ResourceTreeNode;
  onClose: () => void;
};

function loadResource(resource: ResourceTreeNode, setResource: any) {
  if (resource.name && resource.kind && resource.apiVersion) {
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
      } else {
        setResource(null);
      }
    });
  }
}

export function nodeKey(resource: ResourceTreeNode, sep = '-') {
  return [resource.cluster || '', resource.kind || '', resource.namespace, resource.name].join(sep);
}

export const ShowResource = (props: ResourceProps) => {
  const [resource, setResource] = React.useState<ResourceObject>();

  React.useEffect(() => {
    loadResource(props.resource, setResource);
  }, [props.resource]);
  const containerId = uuid();
  return (
    <React.Fragment>
      <DrawerWithFooter
        title={nodeKey(props.resource, '/')}
        placement="right"
        width={600}
        onClose={props.onClose}
      >
        <If condition={resource}>
          <div id={containerId} style={{ height: 'calc(100vh - 100px)' }}>
            <DefinitionCode
              id={containerId + 'content'}
              containerId={containerId}
              language={'yaml'}
              readOnly={true}
              value={yaml.dump(resource)}
            />
          </div>
        </If>
        <If condition={!resource}>
          <Empty message="Loading the resource" />
        </If>
      </DrawerWithFooter>
    </React.Fragment>
  );
};
