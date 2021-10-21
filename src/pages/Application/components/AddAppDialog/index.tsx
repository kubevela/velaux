import React, { createRef, LegacyRef } from 'react';
import { Button, Message, Grid, Dialog, Form, Input, Select, Field, Radio } from '@b-design/ui';
import { withTranslation } from 'react-i18next';
import { dataSourceProject, dataSourceCluster, addApp, addAppDialog } from '../../constants';
import YmalConfig from '../YmalConfig';
import GeneralConfig from '../GeneralConfig';

import './index.less';

type Props = {
  visible: boolean;
  namespaceList?: [];
  setVisible: (visible: boolean) => void;
  t: (key: string) => {};
  dispatch: ({ }) => {};
};

type State = {
  radioValue: string;
};

class AppDialog extends React.Component<Props, State> {
  field: any;
  dialogRef: React.RefObject<GeneralConfig>;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.dialogRef = React.createRef();
    this.state = {
      radioValue: 'General',
    };
  }

  onClose = () => {
    this.props.setVisible(false);
  };

  onOk = () => {
    console.log('this.dispatch', this.props.dispatch);
    console.log('this.dialogRef', this.dialogRef);
    if (this.dialogRef.current) {
      this.dialogRef.current.submit();
    }
  };

  changeRadio = (value: string | number | boolean) => {
    console.log('v value', value);
    this.setState({
      radioValue: value.toString(),
    });
  };

  renderConfig = () => {
    const { radioValue } = this.state;
    const { visible, t, setVisible, dispatch, namespaceList } = this.props;
    if (radioValue === 'General') {
      return (
        <GeneralConfig
          t={t}
          visible={visible}
          setVisible={setVisible}
          dispatch={dispatch}
          namespaceList={namespaceList}
          ref={this.dialogRef}
        />
      );
    } else {
      return <YmalConfig />;
    }
  };

  render() {
    const { Row, Col } = Grid;
    const { visible, t, setVisible, dispatch, namespaceList } = this.props;
    const {
      name,
      project,
      clusterBind,
      describe,
      namePlaceHold,
      clustPlaceHold,
      describePlaceHold,
    } = addAppDialog;
    const FormItem = Form.Item;
    const formItemLayout = {
      labelCol: {
        fixedSpan: 6,
      },
      wrapperCol: {
        span: 18,
      },
    };

    const confirm = t('Confirm').toString();
    const RadioGroup = Radio.Group;
    const { radioValue } = this.state;
    return (
      <div>
        <Dialog
          className="dialog-app-wraper"
          locale={{
            ok: confirm,
            cancel: 'no',
          }}
          title={addApp}
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
                General
              </Radio>
              <Radio id="YmalConfig" value="YmalConfig">
                YmalConfig
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
