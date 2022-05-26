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

export const ShowResource = (props: ResourceProps) => {
  const [resource, setResource] = React.useState<ResourceObject>();

  React.useEffect(() => {
    loadResource(props.resource, setResource);
  }, [props.resource]);

  const containerId = 'resource-show' + resource?.metadata.name;
  return (
    <React.Fragment>
      <DrawerWithFooter
        title={`${props.resource.namespace}/${props.resource.kind}/${props.resource.name}`}
        placement="right"
        width={600}
        onClose={props.onClose}
      >
        <If condition={resource}>
          <div id={containerId} style={{ height: 'calc(100vh - 100px)' }}>
            <DefinitionCode
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
