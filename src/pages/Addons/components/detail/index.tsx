import React from 'react';
import { Form, Button, Loading, Field, Card, Dialog, Table, Message } from '@b-design/ui';
import type { Rule } from '@alifd/field';
import { If } from 'tsx-control-statements/components';
import {
  getAddonsDetails,
  getAddonsStatus,
  disableAddon,
  enableAddon,
  upgradeAddon,
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
  upgradeLoading: boolean;
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
      statusLoading: true,
      upgradeLoading: false,
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
    getAddonsStatus({ name: this.props.addonName })
      .then((res) => {
        if (!res) return;
        if (res.phase == 'enabling') {
          setTimeout(() => {
            this.loadAddonStatus();
          }, 3000);
        }
        if (res.args) {
          this.form.setValue('properties', res.args);
        }
        this.setState({ status: res.phase, args: res.args, statusLoading: false });
      })
      .catch(() => {
        debugger;
        this.setState({ statusLoading: false });
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
  onUpgrade = () => {
    this.form.validate((errors: any, values: any) => {
      if (errors) {
        return;
      }
      this.setState({ upgradeLoading: true });
      upgradeAddon({ name: this.props.addonName, properties: values.properties }).then(() => {
        this.loadAddonStatus();
        this.setState({ upgradeLoading: false });
      });
    });
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
    const { loading, addonDetailInfo, status, statusLoading, upgradeLoading } = this.state;
    const { showAddon } = this.props;
    const validator = (rule: Rule, value: any, callback: (error?: string) => void) => {
      this.uiSchemaRef.current?.validate(callback);
    };
    let showName = addonDetailInfo.name ? addonDetailInfo.name : 'Addon Detail';
    showName = `${showName}(${status})`;
    addonDetailInfo.uiSchema?.map((item) => {
      if (item.jsonKey.indexOf('SECRET_KEY') != -1) {
        item.uiType = 'Password';
      }
      if (item.jsonKey.indexOf('ACCESS_KEY') != -1) {
        item.uiType = 'Password';
      }
    });
    const buttons = [
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
    ];
    if (status == 'enabled') {
      buttons.push(
        <Button
          loading={upgradeLoading}
          type="primary"
          onClick={this.onUpgrade}
          style={{ marginLeft: '16px' }}
        >
          <Translation>Upgrade</Translation>
        </Button>,
      );
    }
    return (
      <div className="basic">
        <DrawerWithFooter title={showName} onClose={this.onClose} extButtons={buttons}>
          <If condition={status == 'enabling'}>
            <Message style={{ marginBottom: '16px' }} type="warning">
              <Translation>Addon is enabling</Translation>
            </Message>
          </If>
          <Loading visible={loading} style={{ width: '100%' }}>
            <If condition={addonDetailInfo.uiSchema && !statusLoading}>
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
                    width="120px"
                    title={<Translation>Name</Translation>}
                  />
                  <Table.Column
                    dataIndex="type"
                    align="left"
                    width="180px"
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
