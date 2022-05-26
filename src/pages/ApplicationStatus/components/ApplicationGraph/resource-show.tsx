import * as React from 'react';
import { detailResource } from '../../../../api/observation';
import DrawerWithFooter from '../../../../components/Drawer';
import type { ResourceTreeNode, ResourceObject } from '../../../../interface/observation';
import * as yaml from 'js-yaml';
import DefinitionCode from '../../../../components/DefinitionCode';
import { If } from 'tsx-control-statements/components';
import Empty from '../../../../components/Empty';

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
      } else {
        setResource(null);
      }
    });
  }
}

export function nodeKey(resource: ResourceTreeNode, sep: string = '-') {
  return [resource.cluster, resource.kind, resource.namespace, resource.name].join(sep);
}

export const ShowResource = (props: ResourceProps) => {
  const [resource, setResource] = React.useState<ResourceObject>();

  React.useEffect(() => {
    loadResource(props.resource, setResource);
  }, [props.resource]);

  const containerId = 'resource-show' + nodeKey(props.resource);
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
