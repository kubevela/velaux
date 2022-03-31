import React from 'react';
import { Field, Grid, Radio, Input, Message } from '@b-design/ui';
import { Dialog, Card, Button, Form } from '@b-design/ui';
import Translation from '../../components/Translation';
import locale from '../../utils/locale';
import i18n from '../../i18n';
import type { SystemInfo } from '../../interface/system';
import { updateSystemInfo } from '../../api/config';
const { Col, Row } = Grid;

type Props = {
  onClose: () => void;
  syncPlatformSetting: () => void;
  systemInfo: SystemInfo;
};

class PlatformSetting extends React.Component<Props> {
  field: Field;

  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
  }

  componentDidMount() {
    this.field.setValues({
      loginType: this.props.systemInfo.loginType,
      enableCollection: this.props.systemInfo.enableCollection,
    });
  }

  onUpdate = () => {
    this.field.validate((errs: any, values: any) => {
      if (errs) {
        return;
      }
      const { enableCollection, loginType, velaAddress } = values;
      const param = { enableCollection, loginType, velaAddress };
      updateSystemInfo(param).then((res) => {
        if (res) {
          Message.success(i18n.t('Update the platform configuration success'));
          this.props.syncPlatformSetting();
        }
      });
    });
  };

  getIssuerDefaultValue = () => {
    const domain = `${window.location.protocol}//${window.location.host}`;
    return domain;
  };
  render() {
    const { onClose } = this.props;
    return (
      <Dialog
        locale={locale.Dialog}
        visible={true}
        className={'commonDialog'}
        title={i18n.t('Platform Setting')}
        autoFocus={true}
        isFullScreen={true}
        style={{ width: '800px' }}
        onClose={onClose}
        footer={
          <div className="next-dialog-footer">
            <Button onClick={onClose}>
              <Translation>Close</Translation>
            </Button>
            <Button type="primary" onClick={this.onUpdate}>
              <Translation>Update</Translation>
            </Button>
          </div>
        }
        height="auto"
        footerAlign="center"
      >
        <Form field={this.field} labelCol={{ fixedSpan: 8 }} wrapperCol={{ span: 16 }}>
          <Card
            style={{ marginBottom: '16px' }}
            locale={locale.Card}
            contentHeight="200px"
            title={<Translation>User authentication configuration</Translation>}
          >
            <Row wrap={true}>
              <Col span={24}>
                <Form.Item required={true} label={i18n.t('User login mode')}>
                  <Radio.Group
                    {...this.field.init('loginType', {
                      rules: [{ required: true }],
                    })}
                  >
                    <Radio value="local" id="local">
                      <Translation>Local</Translation>
                    </Radio>
                    <Radio value="dex" id="dex">
                      <Translation>SSO by dex</Translation>
                    </Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  required={true}
                  label={i18n.t('VelaUX address')}
                  help={i18n.t('There will auto get the domain for access the VelaUX')}
                >
                  <Input
                    {...this.field.init('velaAddress', {
                      initValue: this.getIssuerDefaultValue(),
                      rules: [{ required: true }],
                    })}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* <Card
            style={{ marginBottom: '16px' }}
            locale={locale.Card}
            contentHeight="200px"
            title={<Translation>User experience improvement plan</Translation>}
          >
            <Form.Item />
          </Card> */}
        </Form>
      </Dialog>
    );
  }
}

export default PlatformSetting;
