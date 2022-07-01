import * as React from 'react';
import DrawerWithFooter from '../../../../components/Drawer';
import type { ResourceTreeNode } from '../../../../interface/observation';
import DefinitionCode from '../../../../components/DefinitionCode';
import { If } from 'tsx-control-statements/components';
import Empty from '../../../../components/Empty';
import type {
  ApplicationRevision,
  ApplicationRevisionDetail,
} from '../../../../interface/application';
import { detailRevision } from '../../../../api/application';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Button, Message } from '@b-design/ui';
import Translation from '../../../../components/Translation';
import i18n from '../../../../i18n';

type RevisionProps = {
  appName: string;
  revision: ApplicationRevision;
  onClose: () => void;
};

function loadRevisionDetail(appName: string, revision: ApplicationRevision, setDetail: any) {
  detailRevision({
    appName: appName,
    revision: revision.version,
  }).then((res?: ApplicationRevisionDetail) => {
    if (res) {
      setDetail(res);
    } else {
      setDetail(null);
    }
  });
}

export function nodeKey(resource: ResourceTreeNode, sep: string = '-') {
  return [resource.cluster || '', resource.kind || '', resource.namespace, resource.name].join(sep);
}

export const ShowRevision = (props: RevisionProps) => {
  const [detail, setDetail] = React.useState<ApplicationRevisionDetail>();

  React.useEffect(() => {
    loadRevisionDetail(props.appName, props.revision, setDetail);
  }, [props.appName, props.revision]);
  const containerId = props.revision.version;

  return (
    <React.Fragment>
      <DrawerWithFooter
        title={`${props.appName}-${props.revision.version}`}
        placement="right"
        width={600}
        onClose={props.onClose}
        extButtons={
          <CopyToClipboard
            text={detail?.applyAppConfig || ''}
            onCopy={() => {
              Message.success(i18n.t('The application configuration copied successfully'));
            }}
          >
            <Button>
              <Translation>Copy</Translation>
            </Button>
          </CopyToClipboard>
        }
      >
        <If condition={detail}>
          <div id={containerId} style={{ height: 'calc(100vh - 100px)' }}>
            <DefinitionCode
              id={containerId + 'content'}
              containerId={containerId}
              language={'yaml'}
              readOnly={true}
              value={detail?.applyAppConfig}
            />
          </div>
        </If>
        <If condition={!detail}>
          <Empty message="Loading the revision" />
        </If>
      </DrawerWithFooter>
    </React.Fragment>
  );
};
