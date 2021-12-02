import React from 'react';
import { Form, Button, Loading, Field, Card, Dialog, Table, Message } from '@b-design/ui';
import type { Rule } from '@alifd/field';
import { If } from 'tsx-control-statements/components';
import {
  getAddonsDetails,
  getAddonsStatus,
  disableAddon,
  enableAddon,
} from '../../../../api/addons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './index.less';
import Empty from '../../../../components/Empty';
import DrawerWithFooter from '../../../../components/Drawer';
import Group from '../../../../extends/Group';
import Translation from '../../../../components/Translation';
import UISchema from '../../../../components/UISchema';
import type { Addon } from '../../../../interface/addon';

type Props = {
  addonName: string;
  onClose: () => void;
  dispatch: ({}) => {};
  showAddon?: (name: string) => void;
};

type State = {
  addonDetailInfo: Addon;
  loading: boolean;
  status: 'disabled' | 'enabled' | 'enabling' | '';
  statusLoading: boolean;
  args?: any;
};

class AddonDetailDialog extends React.Component<Props, State> {
  timer?: number;
  readonly refreshTime = 1000;
  form: Field;
  uiSchemaRef: React.RefObject<UISchema>;
  constructor(props: Props) {
    super(props);
    this.state = {
      addonDetailInfo: {
        name: '',
      },
      status: '',
      loading: true,
      statusLoading: false,
    };
    this.form = new Field(this);
    this.uiSchemaRef = React.createRef();
  }

  componentDidMount() {
    this.loadAddonDetail();
    this.loadAddonStatus();
  }

  componentWillUnmount() {
    if (this.timer) {
      window.clearInterval(this.timer);
    }
  }

  loadAddonDetail = async () => {
    getAddonsDetails({ name: this.props.addonName })
      .then((res) => {
        this.setState({ addonDetailInfo: res ? res : {}, loading: false });
      })
      .finally(() => {
        this.setState({ loading: false });
      });
  };

  loadAddonStatus = () => {
    getAddonsStatus({ name: this.props.addonName }).then((res) => {
      if (!res) return;
      this.setState({ status: res.phase, args: res.args, statusLoading: false });
      if (res.phase == 'enabling') {
        setTimeout(() => {
          this.loadAddonStatus();
        }, 3000);
      }
      if (res.args) {
        this.form.setValue('properties', res.args);
      }
    });
  };

  handleSubmit = () => {
    const { status } = this.state;
    if (status === 'enabled') {
      Dialog.confirm({
        content:
          'Are you sure you want to disable the addon? After the addon is disabled, related resources are reclaimed.',
        onOk: this.disableAddon,
      });
      return;
    }
    if (status === 'disabled') {
      this.form.validate((errors: any, values: any) => {
        if (errors) {
          return;
        }
        this.enableAddon(values.properties);
      });
    }
  };
  enableAddon = async (properties: any) => {
    this.setState({ statusLoading: true }, () => {
      enableAddon({ name: this.props.addonName, properties: properties }).then(() => {
        this.loadAddonStatus();
      });
    });
  };

  disableAddon = async () => {
    this.setState({ statusLoading: true }, () => {
      disableAddon({ name: this.props.addonName }).then(() => {
        this.loadAddonStatus();
      });
    });
  };

  onClose = () => {
    this.props.onClose();
  };

  render() {
    const { loading, addonDetailInfo, status, statusLoading } = this.state;
    const { showAddon } = this.props;
    const validator = (rule: Rule, value: any, callback: (error?: string) => void) => {
      this.uiSchemaRef.current?.validate(callback);
    };
    let showName = addonDetailInfo.name ? addonDetailInfo.name : 'Addon Detail';
    showName = `${showName}(${status})`;
    return (
      <div className="basic">
        <DrawerWithFooter
          title={showName}
          onClose={this.onClose}
          extButtons={[
            <Button type="secondary" onClick={this.onClose} style={{ marginRight: '16px' }}>
              <Translation>Cancel</Translation>
            </Button>,
            <Button
              type="primary"
              onClick={this.handleSubmit}
              warning={status === 'enabled'}
              title={status}
              style={{ backgroundColor: status === 'enabled' ? 'red' : '' }}
              loading={statusLoading || loading || status == 'enabling'}
              disabled={status == 'enabling'}
            >
              <Translation>{status === 'enabled' ? 'Disable' : 'Enable'}</Translation>
            </Button>,
          ]}
        >
          <If condition={status == 'enabling'}>
            <Message style={{ marginBottom: '16px' }} type="warning">
              <Translation>Addon is enabling</Translation>
            </Message>
          </If>
          <Loading visible={loading} style={{ width: '100%' }}>
            <If condition={addonDetailInfo.uiSchema}>
              <Group
                title={<Translation>Properties</Translation>}
                description={<Translation>Set the addon configuration parameters</Translation>}
                required={true}
                closed={status === 'enabled'}
              >
                <Form field={this.form}>
                  <UISchema
                    {...this.form.init('properties', {
                      rules: [
                        {
                          validator: validator,
                          message: 'Please check addon properties',
                        },
                      ],
                    })}
                    ref={this.uiSchemaRef}
                    uiSchema={addonDetailInfo.uiSchema}
                  />
                </Form>
              </Group>
            </If>
            <If condition={addonDetailInfo.dependencies}>
              <Card contentHeight="auto" title={<Translation>Dependences</Translation>}>
                <Message type="notice" style={{ marginBottom: '16px' }}>
                  <Translation>Ensure that dependent addon are enabled first.</Translation>
                </Message>
                <ul>
                  {addonDetailInfo.dependencies?.map((item) => {
                    return (
                      <li className="dependen-item" key={item.name}>
                        <a
                          onClick={() => {
                            if (showAddon) {
                              showAddon(item.name);
                            }
                          }}
                        >
                          {item.name}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </If>
            <If condition={addonDetailInfo.definitions}>
              <Card
                contentHeight="auto"
                title={<Translation>Definitions</Translation>}
                style={{ marginTop: '16px' }}
              >
                <Message type="notice" style={{ marginBottom: '16px' }}>
                  <Translation>
                    Enable the addon to obtain the following extension capabilities.
                  </Translation>
                </Message>
                <Table dataSource={addonDetailInfo.definitions}>
                  <Table.Column
                    dataIndex="name"
                    align="left"
                    title={<Translation>Name</Translation>}
                  />
                  <Table.Column
                    dataIndex="type"
                    align="left"
                    width="100px"
                    cell={(v: string) => {
                      return <Translation>{v}</Translation>;
                    }}
                    title={<Translation>Type</Translation>}
                  />
                  <Table.Column
                    dataIndex="description"
                    align="left"
                    title={<Translation>Description</Translation>}
                  />
                </Table>
              </Card>
            </If>
            <Card
              contentHeight="auto"
              title={<Translation>Readme</Translation>}
              style={{ marginTop: '16px' }}
            >
              <If condition={addonDetailInfo.detail}>
                <ReactMarkdown
                  children={addonDetailInfo.detail || ''}
                  remarkPlugins={[remarkGfm]}
                />
              </If>
              <If condition={!addonDetailInfo.detail}>
                <div className="readme-empty">
                  <Empty />
                </div>
              </If>
            </Card>
          </Loading>
        </DrawerWithFooter>
      </div>
    );
  }
}

export default AddonDetailDialog;
