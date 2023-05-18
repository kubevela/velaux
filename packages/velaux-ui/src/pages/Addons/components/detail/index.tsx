import type { Rule } from '@alifd/field';
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
} from '@alifd/next';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { getAddonsDetails, getAddonsStatus, disableAddon, enableAddon, upgradeAddon } from '../../../../api/addons';
import { listApplicationServiceEndpoints } from '../../../../api/observation';
import DrawerWithFooter from '../../../../components/Drawer';
import Empty from '../../../../components/Empty';
import Permission from '../../../../components/Permission';
import StatusShow from '../../../../components/StatusShow';
import { Translation } from '../../../../components/Translation';
import UISchema from '../../../../components/UISchema';
import i18n from '../../../../i18n';
import type { Addon, AddonStatus, EnableAddonRequest , ApplicationStatus, UIParam , NameAlias , Endpoint } from '@velaux/data';
import { locale } from '../../../../utils/locale';

import 'github-markdown-css/github-markdown-light.css';
import './index.less';
import { Link } from 'dva/router';

import { getLink } from '../../../../utils/utils';
import { BiCodeBlock, BiLaptop } from 'react-icons/bi';

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
  enableLoading?: boolean;
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
  propertiesMode: 'code' | 'native';
  schema?: UIParam[];
};

class AddonDetailDialog extends React.Component<Props, State> {
  form: Field;
  statusLoop: boolean;
  uiSchemaRef: React.RefObject<UISchema>;
  timeout: NodeJS.Timeout | null;
  constructor(props: Props) {
    super(props);
    this.state = {
      propertiesMode: 'native',
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
    this.timeout = null;
  }

  componentDidMount() {
    this.loadAddonDetail();
    this.loadAddonStatus();
    this.loadAddonEndpoints();
  }

  componentWillUnmount(): void {
    if (this.timeout != null) {
      clearTimeout(this.timeout);
    }
  }

  loadAddonDetail = async () => {
    const { version } = this.state;
    this.setState({ loading: true });
    getAddonsDetails({ name: this.props.addonName, version: version })
      .then((res: Addon) => {
        if (res) {
          this.setState({ addonDetailInfo: res, schema: res.uiSchema, loading: false });
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
        if (!res) {
          return;
        }
        if ((res.phase == 'enabling' || res.phase === 'disabling') && !this.statusLoop) {
          this.statusLoop = true;
          this.timeout = setTimeout(() => {
            this.statusLoop = false;
            this.loadAddonStatus();
          }, 4000);
        }

        let clusters: string[] = [];
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
      content: i18n.t('Please make sure this addon is not used anywhere and related applications recycled.'),
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
        Message.warning(i18n.t('Please select want to enable version firstly'));
        return;
      }
      if (
        this.state.addonDetailInfo?.deployTo?.runtimeCluster &&
        (!this.state.clusters || this.state.clusters.length == 0)
      ) {
        Message.warning(i18n.t('Please select at least one cluster firstly.'));
        return;
      }
      this.setState({ upgradeLoading: true });
      const params: EnableAddonRequest = {
        name: this.props.addonName,
        version: this.state.version,
        properties: values.properties,
        registry: this.state.addonDetailInfo?.registryName,
      };
      if (this.state.addonDetailInfo?.deployTo?.runtimeCluster) {
        params.clusters = this.state.clusters;
      }
      upgradeAddon(params).then(() => {
        this.loadAddonStatus();
        this.setState({ upgradeLoading: false });
      });
    });
  };

  enableAddon = async (properties: any) => {
    if (!this.state.version) {
      Message.warning(i18n.t('Please select want to enable version'));
      return;
    }
    if (
      this.state.addonDetailInfo?.deployTo?.runtimeCluster &&
      (!this.state.clusters || this.state.clusters.length == 0)
    ) {
      Message.warning(i18n.t('Please select at least one cluster firstly.'));
      return;
    }
    this.setState({ statusLoading: true, enableLoading: true }, () => {
      if (this.state.version) {
        const params: EnableAddonRequest = {
          name: this.props.addonName,
          version: this.state.version,
          properties: properties,
          registry: this.state.addonDetailInfo?.registryName,
        };
        if (this.state.addonDetailInfo?.deployTo?.runtimeCluster) {
          params.clusters = this.state.clusters;
        }
        enableAddon(params)
          .then(() => {
            this.loadAddonStatus();
          })
          .finally(() => {
            this.setState({ enableLoading: false });
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
      this.setState({ schema: undefined }, () => {
        this.loadAddonDetail();
      });
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
      enableLoading,
      addonsStatus,
      showStatusVisible,
      version,
      clusters,
      allClusters,
      enabledClusters,
      endpoints,
      propertiesMode,
      schema,
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
    const buttons: React.ReactNode[] = [];

    const workflowStatus = addonsStatus?.status;

    if (status === 'enabled' || status === 'enabling' || status === 'disabling') {
      buttons.push(
        <Permission
          request={{
            resource: `addon:${addonName}`,
            action: 'disable',
          }}
          key={'disable'}
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
        </Permission>
      );
    }

    if (status == 'enabled' || status == 'suspend' || workflowStatus == 'workflowFailed') {
      buttons.push(
        <Permission key={'upgrade'} request={{ resource: `addon:${addonName}`, action: 'update' }} project={''}>
          <Button loading={upgradeLoading} type="primary" onClick={this.onUpgrade} style={{ marginLeft: '16px' }}>
            <Translation>Upgrade</Translation>
          </Button>
        </Permission>
      );
    }

    if (status === 'disabled' || (status === 'enabling' && workflowStatus != 'workflowFailed')) {
      buttons.push(
        <Permission key={'enable'} request={{ resource: `addon:${addonName}`, action: 'enable' }} project={''}>
          <Button
            loading={status === 'enabling' || enableLoading}
            type="primary"
            onClick={this.onEnable}
            style={{ marginLeft: '16px' }}
          >
            <Translation>Enable</Translation>
          </Button>
        </Permission>
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
    const notice = "This addon is experimental, please don't use it in production";
    return (
      <div className="basic">
        <DrawerWithFooter title={showName} width={800} placement="right" onClose={this.onClose} extButtons={buttons}>
          <Loading visible={loading} style={{ width: '100%' }}>
            {addonDetailInfo && addonDetailInfo.registryName == 'experimental' && (
              <Message type="warning">
                <Translation>{notice}</Translation>
              </Message>
            )}

            {addonsStatus && addonsStatus.status && (
              <Row>
                <Col span={16}>
                  <Message
                    type={getAppStatusShowType(addonsStatus?.status)}
                    size="medium"
                    style={{ padding: '8px', marginBottom: '10px' }}
                  >
                    {`${i18n.t('Addon status is ')}${addonsStatus?.status || 'Init'}`}
                    <Link style={{ marginLeft: '16px' }} to={`/applications/addon-${addonDetailInfo?.name}/envbinding`}>
                      <Translation>Check the details</Translation>
                    </Link>
                  </Message>
                </Col>
                {outerEndpoint && outerEndpoint?.length > 0 && (
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
                              {item.endpoint.portName && (
                                <span className="margin-right-5">{item.endpoint.portName}:</span>
                              )}

                              <a style={{ color: '#1b58f4' }} target="_blank" href={linkURL} rel="noopener noreferrer">
                                {linkURL}
                              </a>
                            </Menu.Item>
                          );
                        })}
                      </Menu>
                    </Dropdown>
                  </Col>
                )}
              </Row>
            )}

            {/* select the addon version */}
            <Card title="" contentHeight={'auto'} style={{ marginBottom: '16px' }}>
              {addonDetailInfo?.availableVersions && (
                <div>
                  <Form.Item required label={i18n.t('Version').toString()}>
                    <Select
                      onChange={this.changeVersion}
                      dataSource={addonDetailInfo?.availableVersions || []}
                      value={version}
                    />
                  </Form.Item>
                  {addonDetailInfo?.system && (
                    <span className="warning-text">
                      This version requirements: (
                      {addonDetailInfo?.system.vela ? `KubeVela: ${addonDetailInfo?.system.vela}` : ''}
                      {addonDetailInfo?.system.kubernetes ? ` Kubernetes: ${addonDetailInfo?.system.kubernetes}` : ''})
                    </span>
                  )}
                </div>
              )}

              {addonDetailInfo?.deployTo?.runtimeCluster && (
                <Form.Item required label={i18n.t('Deployed Clusters').toString()}>
                  <Checkbox.Group
                    className="custom-cluster-checkbox"
                    onChange={this.changeCluster}
                    value={clusters}
                    dataSource={clusterOptions}
                  />
                </Form.Item>
              )}
            </Card>

            {schema && (
              <Card
                contentHeight={'auto'}
                className="withActions"
                title="Properties"
                subTitle={
                  schema
                    ? [
                        <Button
                          style={{ marginTop: '-12px', alignItems: 'center', display: 'flex' }}
                          onClick={() => {
                            if (propertiesMode === 'native') {
                              this.setState({ propertiesMode: 'code' });
                            } else {
                              this.setState({ propertiesMode: 'native' });
                            }
                          }}
                        >
                          {propertiesMode === 'native' && (
                            <BiCodeBlock size={14} title={i18n.t('Switch to the coding mode')} />
                          )}
                          {propertiesMode === 'code' && (
                            <BiLaptop size={14} title={i18n.t('Switch to the native mode')} />
                          )}
                        </Button>,
                      ]
                    : []
                }
              >
                <Row>
                  {this.state.mode && schema && (
                    <UISchema
                      {...this.form.init(`properties`, {
                        rules: [
                          {
                            validator: validator,
                            message: i18n.t('Please check the addon properties'),
                          },
                        ],
                      })}
                      enableCodeEdit={propertiesMode === 'code'}
                      uiSchema={schema}
                      definition={{
                        name: addonDetailInfo?.name || '',
                        type: 'addon',
                        description: addonDetailInfo?.description || '',
                      }}
                      ref={this.uiSchemaRef}
                      mode={this.state.mode}
                    />
                  )}
                </Row>
              </Card>
            )}
            {addonDetailInfo?.dependencies && (
              <Card locale={locale().Card} contentHeight="auto" title={<Translation>Dependencies</Translation>}>
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
            )}
            {addonDetailInfo?.definitions && (
              <Card
                contentHeight="auto"
                locale={locale().Card}
                title={<Translation>Definitions</Translation>}
                style={{ marginTop: '16px' }}
              >
                <Message type="notice" style={{ marginBottom: '16px' }}>
                  <Translation>Enable the addon to obtain the following extension capabilities</Translation>
                </Message>
                <Table locale={locale().Table} dataSource={addonDetailInfo?.definitions}>
                  <Table.Column dataIndex="name" align="left" width="140px" title={<Translation>Name</Translation>} />
                  <Table.Column
                    dataIndex="type"
                    align="left"
                    width="160px"
                    cell={(v: string) => {
                      return <Translation>{v}</Translation>;
                    }}
                    title={<Translation>Type</Translation>}
                  />
                  <Table.Column dataIndex="description" align="center" title={<Translation>Description</Translation>} />
                </Table>
              </Card>
            )}
            <Card
              contentHeight="auto"
              locale={locale().Card}
              title={<Translation>README</Translation>}
              style={{ marginTop: '16px' }}
            >
              {addonDetailInfo?.detail && (
                <ReactMarkdown className="markdown-body addon-readme" remarkPlugins={[remarkGfm]}>
                  {addonDetailInfo?.detail || ''}
                </ReactMarkdown>
              )}
              {!addonDetailInfo?.detail && (
                <div className="readme-empty">
                  <Empty />
                </div>
              )}
            </Card>
          </Loading>
        </DrawerWithFooter>

        {showStatusVisible && (
          <StatusShow
            loading={statusLoading}
            title={<Translation>Addon Status</Translation>}
            applicationStatus={addonsStatus}
            loadStatusDetail={this.loadAddonStatus}
            onClose={this.onStatusClose}
          />
        )}
      </div>
    );
  }
}

export default AddonDetailDialog;
