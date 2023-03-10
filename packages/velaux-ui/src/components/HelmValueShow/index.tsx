import { Dialog, Select } from '@alifd/next';
import * as React from 'react';

import i18n from '../../i18n';
import DefinitionCode from '../DefinitionCode';
import './index.less';

type Props = {
  onClose: () => void;
  valueFiles: Record<string, string>;
  name: string;
};
const HelmValueShow: React.FC<Props> = (props: Props) => {
  const [valueFile, setValueFile] = React.useState<string>('values.yaml');
  return (
    <Dialog
      className={'helmValueDialog'}
      overflowScroll={true}
      visible={true}
      onClose={props.onClose}
      footer={<div />}
      title={i18n.t('Show Values File').toString()}
    >
      <Select
        onChange={(name) => {
          setValueFile(name);
        }}
        defaultValue={valueFile}
        dataSource={Object.keys(props.valueFiles)}
        style={{ marginBottom: '8px' }}
      />
      <div id={'chart-' + props.name} className="diff-box">
        <DefinitionCode
          language={'yaml'}
          containerId={'chart-' + props.name}
          readOnly
          value={props.valueFiles[valueFile]}
        />
      </div>
    </Dialog>
  );
};
export default HelmValueShow;
