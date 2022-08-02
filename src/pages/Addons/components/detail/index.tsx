import React from 'react';
import {
  Form,
  Button,
  Loading,
  Field,
  Card,
  Dialog,
  Table,
  Message,
  Select,
  Checkbox,
  Grid,
  Dropdown,
  Menu,
} from '@b-design/ui';
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
import Empty from '../../../../components/Empty';
import DrawerWithFooter from '../../../../components/Drawer';
import Group from '../../../../extends/Group';
import Translation from '../../../../components/Translation';
import UISchema from '../../../../components/UISchema';
import type { Addon, AddonStatus } from '../../../../interface/addon';
import locale from '../../../../utils/locale';
import StatusShow from '../../../../components/StatusShow';
import type { ApplicationStatus } from '../../../../interface/application';
import i18n from '../../../../i18n';
import type { NameAlias } from '../../../../interface/env';
import Permission from '../../../../components/Permission';
import 'github-markdown-css/github-markdown-light.css';
import './index.less';
import { Link } from 'dva/router';
import { listApplicationServiceEndpoints } from '../../../../api/observation';
import type { Endpoint } from '../../../../interface/observation';
import { getLink } from '../../../../utils/utils';

const { Col, Row } = Grid;

type Props = {
  addonName: string;
  onClose: () => void;
  dispatch: ({}) => {};
  showAddon?: (name: string) => void;
};

type State = {
  addonDetailInfo?: Addon;
  loading: boolean;
  status: 'disabled' | 'enabled' | 'enabling' | 'suspend' | 'disabling' | '';
  statusLoading: boolean;
  upgradeLoading: boolean;
  args?: any;
  addonsStatus?: ApplicationStatus;
  showStatusVisible: boolean;
  mode?: 'new' | 'edit';
  version?: string;
  clusters?: string[];
  allClusters?: NameAlias[];
  enabledClusters?: string[];
  endpoints?: Endpoint[];
};

class AddonDetailDialog extends React.Component<Props, State> {
  form: Field;
  statusLoop: boolean;
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
      showStatusVisible: false,
    };
    this.form = new Field(this);
    this.uiSchemaRef = React.createRef();
    this.statusLoop = false;
  }

  componentDidMount() {
    this.loadAddonDetail();
    this.loadAddonStatus();
    this.loadAddonEndpoints();
  }

  loadAddonDetail = async () => {
    const { version } = this.state;
    this.setState({ loading: true });
    getAddonsDetails({ name: this.props.addonName, version: version })
      .then((res: Addon) => {
        if (res) {
          this.setState({ addonDetailInfo: res, loading: false });
          if (!this.state.version && res.version) {
            this.setState({ version: res.version });
          }
        }
      })
      .finally(() => {
        this.setState({ loading: false });
      });
  };

  loadAddonStatus = () => {
    this.setState({ statusLoading: true });
    getAddonsStatus({ name: this.props.addonName })
      .then((res: AddonStatus) => {
        if (!res) return;
        if ((res.phase == 'enabling' || res.phase === 'disabling') && !this.statusLoop) {
          this.statusLoop = true;
          setTimeout(() => {
            this.statusLoop = false;
            this.loadAddonStatus();
          }, 3000);
        }

        let clusters = undefined;
        if (res.args) {
          this.form.setValue('properties', res.args);
          this.setState({ mode: 'edit' });
          if (res.args.clusters) {
            clusters = res.args.clusters;
          }
        } else {
          this.setState({ mode: 'new' });
        }

        let enabledClusters: string[] = [];
        if (res.clusters) {
          enabledClusters = Object.keys(res.clusters);
        }
        if (res.clusters && (!clusters || clusters.length == 0)) {
          clusters = enabledClusters;
        }
        this.setState({
          status: res.phase,
          args: res.args,
          version: res.installedVersion || this.state.version,
          allClusters: res.allClusters,
          statusLoading: false,
          clusters: clusters || ['local'],
          addonsStatus: res.appStatus,
          enabledClusters: enabledClusters,
        });
      })
      .catch(() => {
        this.setState({ statusLoading: false });
      });
  };

  loadAddonEndpoints = () => {
    // TODO: the app name and namespace should get from the api server.
    const appName = 'addon-' + this.props.addonName;
    listApplicationServiceEndpoints({
      appName: appName,
      appNs: 'vela-system',
    }).then((re) => {
      if (re && re.endpoints) {
        this.setState({ endpoints: re.endpoints });
      } else {
        this.setState({ endpoints: [] });
      }
    });
  };

  onDisable = () => {
    Dialog.confirm({
      content:
        'Please make sure that the Addon is no longer in use and the related application has been recycled.',
      onOk: this.disableAddon,
      locale: locale().Dialog,
    });
    return;
  };

  onEnable = () => {
    this.form.validate((errors: any, values: any) => {
      if (errors) {
        return;
      }
      this.enableAddon(values.properties);
    });
  };

  onUpgrade = () => {
    this.form.validate((errors: any, values: any) => {
      if (errors) {
        return;
      }
      if (!this.state.version) {
        Message.warning(i18n.t('Please firstly select want to enable version'));
        return;
      }
      if (
        this.state.addonDetailInfo?.deployTo?.runtimeCluster &&
        (!this.state.clusters || this.state.clusters.length == 0)
      ) {
        Message.warning(i18n.t('Please firstly select at least one cluster.'));
        return;
      }
      this.setState({ upgradeLoading: true });
      upgradeAddon({
        name: this.props.addonName,
        version: this.state.version,
        clusters: this.state.clusters,
        properties: values.properties,
      }).then(() => {
        this.loadAddonStatus();
        this.setState({ upgradeLoading: false });
      });
    });
  };
  enableAddon = async (properties: any) => {
    if (!this.state.version) {
      Message.warning(i18n.t('Please firstly select want to enable version'));
      return;
    }
    if (
      !this.state.addonDetailInfo?.deployTo?.runtimeCluster &&
      (!this.state.clusters || this.state.clusters.length == 0)
    ) {
      Message.warning(i18n.t('Please firstly select at least one cluster.'));
      return;
    }
    this.setState({ statusLoading: true }, () => {
      if (this.state.version) {
        enableAddon({
          name: this.props.addonName,
          version: this.state.version,
          clusters: this.state.clusters,
          properties: properties,
        }).then(() => {
          this.loadAddonStatus();
        });
      }
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

  updateStatusShow = (show: boolean) => {
    this.setState({ showStatusVisible: show });
  };

  onStatusClose = () => {
    this.setState({ showStatusVisible: false });
  };
  changeVersion = (version: string) => {
    this.setState({ version: version }, () => {
      this.loadAddonDetail();
    });
  };

  changeCluster = (values: string[]) => {
    if (!values.includes('local')) {
      Message.warning('The local cluster ie required');
      values.push('local');
    }
    this.setState({ clusters: values });
  };

  render() {
    const {
      loading,
      addonDetailInfo,
      status,
      statusLoading,
      upgradeLoading,
      addonsStatus,
      showStatusVisible,
      version,
      clusters,
      allClusters,
      enabledClusters,
      endpoints,
    } = this.state;
    const { showAddon, addonName } = this.props;
    const validator = (rule: Rule, value: any, callback: (error?: string) => void) => {
      this.uiSchemaRef.current?.validate(callback);
    };
    let showName = addonDetailInfo?.name ? addonDetailInfo.name : 'Addon Detail';
    showName = `${showName}(${status})`;
    addonDetailInfo?.uiSchema?.map((item) => {
      if (item.jsonKey.indexOf('SECRET_KEY') != -1) {
        item.uiType = 'Password';
      }
      if (item.jsonKey.indexOf('ACCESS_KEY') != -1) {
        item.uiType = 'Password';
      }
    });
    const buttons = [];
    if (status === 'enabled' || status === 'enabling' || status === 'disabling') {
      buttons.push(
        <Permission
          request={{
            resource: `addon:${addonName}`,
            action: 'disable',
          }}
          project={''}
        >
          <Button
            type="secondary"
            onClick={this.onDisable}
            title={status}
            className="danger-btn"
            loading={status === 'disabling'}
            disabled={status === 'disabling'}
          >
            <Translation>Disable</Translation>
          </Button>
        </Permission>,
      );
    }

    if (status == 'enabled' || status == 'suspend') {
      buttons.push(
        <Permission request={{ resource: `addon:${addonName}`, action: 'update' }} project={''}>
          <Button
            loading={upgradeLoading}
            type="primary"
            onClick={this.onUpgrade}
            style={{ marginLeft: '16px' }}
          >
            <Translation>Upgrade</Translation>
          </Button>
        </Permission>,
      );
    }

    if (status === 'disabled' || status === 'enabling') {
      buttons.push(
        <Permission request={{ resource: `addon:${addonName}`, action: 'enable' }} project={''}>
          <Button
            loading={status === 'enabling'}
            type="primary"
            onClick={this.onEnable}
            style={{ marginLeft: '16px' }}
          >
            <Translation>Enable</Translation>
          </Button>
        </Permission>,
      );
    }

    const getAppStatusShowType = (statusInfo: string | undefined) => {
      if (!statusInfo) {
        return 'notice';
      }
      switch (statusInfo) {
        case 'running':
          return 'success';
        case 'workflowFinished':
          return 'success';
        case 'unhealthy':
          return 'error';
      }
      return 'warning';
    };

    const clusterOptions = allClusters?.map((cluster: NameAlias) => {
      let label: any = cluster.alias || cluster.name;
      if (enabledClusters?.includes(cluster.name)) {
        label = (
          <span>
            {label}(<span style={{ color: 'green' }}>enabled</span>)
          </span>
        );
      }
      return {
        label: label,
        value: cluster.name,
      };
    });

    const outerEndpoint = endpoints?.filter((end) => !end.endpoint.inner);

    return (
      <div className="basic">
        <DrawerWithFooter
          title={showName}
          width={800}
          placement="right"
          onClose={this.onClose}
          extButtons={buttons}
        >
          <Loading visible={loading} style={{ width: '100%' }}>
            <If condition={addonDetailInfo && addonDetailInfo.registryName == 'experimental'}>
              <Message type="warning">
                <Translation>
                  This addon is experimental, please don't use it in production
                </Translation>
              </Message>
            </If>

            <If condition={addonsStatus && addonsStatus.status}>
              <Row>
                <Col span={16}>
                  <Message
                    type={getAppStatusShowType(addonsStatus?.status)}
                    size="medium"
                    style={{ padding: '8px', marginBottom: '10px' }}
                  >
                    {`${i18n.t('Addon status is ')}${addonsStatus?.status || 'Init'}`}
                    <Link
                      style={{ marginLeft: '16px' }}
                      to={`/applications/addon-${addonDetailInfo?.name}`}
                    >
                      <Translation>Check the details</Translation>
                    </Link>
                  </Message>
                </Col>
                <If condition={outerEndpoint && outerEndpoint?.length > 0}>
                  <Col span={8} className={'flexright'}>
                    <Dropdown
                      trigger={
                        <Button style={{ marginLeft: '16px' }} type="secondary">
                          <Translation>Endpoints</Translation>
                        </Button>
                      }
                    >
                      <Menu>
                        {outerEndpoint?.map((item) => {
                          const linkURL = getLink(item);
                          return (
                            <Menu.Item key={linkURL}>
                              <a style={{ color: '#1b58f4' }} target="_blank" href={linkURL}>
                                {linkURL}
                              </a>
                            </Menu.Item>
                          );
                        })}
                      </Menu>
                    </Dropdown>
                  </Col>
                </If>
              </Row>
            </If>

            {/* select the addon version */}
            <Card title="" contentHeight={'auto'} style={{ marginBottom: '16px' }}>
              <If condition={addonDetailInfo?.availableVersions}>
                <Form.Item required label={i18n.t('Version')}>
                  <Select
                    onChange={this.changeVersion}
                    dataSource={addonDetailInfo?.availableVersions || []}
                    value={version}
                  />
                </Form.Item>
              </If>

              <If condition={addonDetailInfo?.deployTo?.runtimeCluster}>
                <Form.Item required label={i18n.t('Deployed Clusters')}>
                  <Checkbox.Group
                    className="custom-cluster-checkbox"
                    onChange={this.changeCluster}
                    value={clusters}
                    dataSource={clusterOptions}
                  />
                </Form.Item>
              </If>
            </Card>

            <If condition={addonDetailInfo?.uiSchema}>
              <Group
                title={<Translation>Properties</Translation>}
                description={<Translation>Set the addon configuration parameters</Translation>}
                required={true}
                closed={status === 'enabled'}
                alwaysShow={true}
                disableAddon={true}
                hasToggleIcon={true}
              >
                <Form field={this.form}>
                  {this.state.mode && (
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
                      uiSchema={addonDetailInfo?.uiSchema}
                      mode={this.state.mode}
                    />
                  )}
                </Form>
              </Group>
            </If>
            <If condition={addonDetailInfo?.dependencies}>
              <Card
                locale={locale().Card}
                contentHeight="auto"
                title={<Translation>Dependencies</Translation>}
              >
                <Message type="notice" style={{ marginBottom: '16px' }}>
                  <Translation>Ensure that dependent addon are enabled first.</Translation>
                </Message>
                <ul>
                  {addonDetailInfo?.dependencies?.map((item) => {
                    return (
                      <li className="dependency-item" key={item.name}>
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
            <If condition={addonDetailInfo?.definitions}>
              <Card
                contentHeight="auto"
                locale={locale().Card}
                title={<Translation>Definitions</Translation>}
                style={{ marginTop: '16px' }}
              >
                <Message type="notice" style={{ marginBottom: '16px' }}>
                  <Translation>
                    Enable the addon to obtain the following extension capabilities
                  </Translation>
                </Message>
                <Table locale={locale().Table} dataSource={addonDetailInfo?.definitions}>
                  <Table.Column
                    dataIndex="name"
                    align="left"
                    width="140px"
                    title={<Translation>Name</Translation>}
                  />
                  <Table.Column
                    dataIndex="type"
                    align="left"
                    width="160px"
                    cell={(v: string) => {
                      return <Translation>{v}</Translation>;
                    }}
                    title={<Translation>Type</Translation>}
                  />
                  <Table.Column
                    dataIndex="description"
                    align="center"
                    title={<Translation>Description</Translation>}
                  />
                </Table>
              </Card>
            </If>
            <Card
              contentHeight="auto"
              locale={locale().Card}
              title={<Translation>README</Translation>}
              style={{ marginTop: '16px' }}
            >
              <If condition={addonDetailInfo?.detail}>
                <ReactMarkdown
                  className="markdown-body addon-readme"
                  children={addonDetailInfo?.detail || ''}
                  remarkPlugins={[remarkGfm]}
                />
              </If>
              <If condition={!addonDetailInfo?.detail}>
                <div className="readme-empty">
                  <Empty />
                </div>
              </If>
            </Card>
          </Loading>
        </DrawerWithFooter>

        <If condition={showStatusVisible}>
          <StatusShow
            loading={statusLoading}
            title={<Translation>Addon Status</Translation>}
            applicationStatus={addonsStatus}
            loadStatusDetail={this.loadAddonStatus}
            onClose={this.onStatusClose}
          />
        </If>
      </div>
    );
  }
}

export default AddonDetailDialog;
