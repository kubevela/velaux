import React from 'react';
import { Input, Select, Button, Message, Dialog, Form, Field, Grid } from '@b-design/ui';
import { If } from 'tsx-control-statements/components';
import Translation from '../../../../components/Translation';
import { createClusterNamespace } from '../../../../api/cluster';
import locale from '../../../../utils/locale';
import './index.less';

type Props = {
  cluster?: string;
  namespaces?: NamespaceItem[];
  onChange?: (namespace: string) => void;
  value?: any;
  loadNamespaces: (cluster: string) => void;
  disableNew?: boolean;
  disabled?: boolean;
  createNamespaceDialog?: boolean;
  targetField: Field;
};

export interface NamespaceItem {
  value: string;
  label: string;
}

type State = {
  inputNamespaceParam: string;
  loading: boolean;
  createNamespace?: string;
  visible: boolean;
};

class Namespace extends React.Component<Props, State> {
  field: Field;
  constructor(props: any) {
    super(props);
    this.state = {
      inputNamespaceParam: '',
      loading: false,
      visible: false,
    };
    this.field = new Field(this);
  }

  openNamespaceInput = () => {
    const { createNamespaceDialog } = this.props;
    if (createNamespaceDialog) {
      this.field.setValue('namespace', '');
      this.setState({
        visible: true,
      });
    }
  };

  createNamespace = () => {
    const { cluster, loadNamespaces, targetField } = this.props;
    if (!cluster) {
      Message.warning('Please select a cluster first');
      return;
    }
    const { createNamespace } = this.state;
    const namespace = createNamespace || this.field.getValue('namespace');
    this.setState({ loading: true });
    if (cluster && namespace) {
      createClusterNamespace({ cluster: cluster, namespace: namespace }).then((re) => {
        if (re) {
          Message.success('create namespace success');
          loadNamespaces(cluster);
        }
        targetField.setValue('runtimeNamespace', namespace);
        this.setState({
          loading: false,
          visible: false,
        });
      });
    }
  };

  onClose = () => {
    this.setState({
      visible: false,
    });
  };

  render() {
    const { disableNew, onChange, namespaces, value, disabled } = this.props;
    const { visible } = this.state;
    const { Col, Row } = Grid;
    const init = this.field.init;
    const formItemLayout = {
      labelCol: {
        fixedSpan: 10,
      },
      wrapperCol: {
        span: 14,
      },
    };

    return (
      <div>
        <div className="cluster-container">
          <Select
            locale={locale().Select}
            className="cluster-params-input"
            mode="single"
            disabled={disabled}
            dataSource={namespaces}
            onChange={onChange}
            placeholder={''}
            value={value}
          />
          <If condition={!disableNew}>
            <Button
              className="cluster-option-btn"
              type="secondary"
              disabled={disabled}
              onClick={this.openNamespaceInput}
            >
              <Translation>New</Translation>
            </Button>
          </If>
        </div>

        <Dialog
          locale={locale().Dialog}
          className={'namespaceDialogWraper'}
          title={<Translation>Create Namespace</Translation>}
          autoFocus={true}
          isFullScreen={true}
          visible={visible}
          onOk={this.createNamespace}
          onCancel={this.onClose}
          onClose={this.onClose}
          footerActions={['cancel', 'ok']}
          footerAlign="center"
        >
          <Form field={this.field} {...formItemLayout}>
            <Row>
              <Col span={24} style={{ padding: '0 8px' }}>
                <Form.Item label={<Translation>namespace</Translation>} required>
                  <Input
                    name="namespace"
                    placeholder={'Please enter'}
                    {...init('namespace', {
                      rules: [
                        {
                          required: true,
                          message: 'Please select namesapce',
                        },
                      ],
                    })}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Dialog>
      </div>
    );
  }
}

export default Namespace;
