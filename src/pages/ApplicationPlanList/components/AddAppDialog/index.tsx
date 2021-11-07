import React from 'react';
import { Grid, Dialog, Field, Radio } from '@b-design/ui';
import { withTranslation } from 'react-i18next';
import { NEW_APPLICATION_DELIVERY_PLAN } from '../../constants';
import YmalConfig from '../YmalConfig';
import GeneralConfig from '../GeneralConfig';

import './index.less';
import Translation from '../../../../components/Translation';

type Props = {
  visible: boolean;
  namespaceList?: [];
  clusterList?: [];
  setVisible: (visible: boolean) => void;
  t: (key: string) => {};
  dispatch: ({}) => {};
};

type State = {
  radioValue: string;
};

class AppDialog extends React.Component<Props, State> {
  field: Field;
  dialogRef: React.RefObject<GeneralConfig>;
  ymalConfigRef: React.RefObject<YmalConfig>;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.dialogRef = React.createRef();
    this.ymalConfigRef = React.createRef();
    this.state = {
      radioValue: 'General',
    };
  }

  onClose = () => {
    this.props.setVisible(false);
  };

  onOk = () => {
    if (this.dialogRef.current) {
      this.dialogRef.current.submit();
    }

    if (this.ymalConfigRef.current) {
      this.ymalConfigRef.current.submit();
    }
  };

  changeRadio = (value: string | number | boolean) => {
    this.setState({
      radioValue: value.toString(),
    });
  };

  renderConfig = () => {
    const { radioValue } = this.state;
    const { visible, t, setVisible, dispatch, namespaceList, clusterList } = this.props;
    if (radioValue === 'General') {
      return (
        <GeneralConfig
          t={t}
          visible={visible}
          setVisible={setVisible}
          dispatch={dispatch}
          namespaceList={namespaceList}
          clusterList={clusterList}
          ref={this.dialogRef}
        />
      );
    } else {
      return (
        <YmalConfig
          t={t}
          visible={visible}
          setVisible={setVisible}
          dispatch={dispatch}
          namespaceList={namespaceList}
          ref={this.ymalConfigRef}
        />
      );
    }
  };

  render() {
    const { Row, Col } = Grid;
    const { visible, t, setVisible, dispatch, namespaceList } = this.props;
    const confirm = t('Confirm').toString();
    const RadioGroup = Radio.Group;
    return (
      <div>
        <Dialog
          className="dialog-app-wraper"
          locale={{
            ok: confirm,
            cancel: 'no',
          }}
          title={NEW_APPLICATION_DELIVERY_PLAN}
          autoFocus={true}
          visible={visible}
          footerActions={['ok']}
          onOk={this.onOk}
          onCancel={this.onClose}
          onClose={this.onClose}
        >
          <div className="radio-group-wraper">
            <RadioGroup
              shape="button"
              size="large"
              value={this.state.radioValue}
              onChange={this.changeRadio}
            >
              <Radio id="General" value="General">
                <Translation>GeneralConfig</Translation>
              </Radio>
              <Radio id="YmalConfig" value="YmalConfig">
                <Translation>YmalConfig</Translation>
              </Radio>
            </RadioGroup>
          </div>
          {this.renderConfig()}
        </Dialog>
      </div>
    );
  }
}

export default withTranslation()(AppDialog);
