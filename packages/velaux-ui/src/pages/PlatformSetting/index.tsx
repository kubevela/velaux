import { Field, Grid, Radio, Input, Message, Switch, Select, Dialog, Card, Button, Form } from '@alifd/next';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React from 'react';
import { AiOutlineDelete, AiOutlinePlus } from 'react-icons/ai';
import { v4 as uuid } from 'uuid';
import { MdOutlineHelpCenter } from 'react-icons/md';

import { getDexConfig } from '../../api/authentication';
import { getProjectList, getProjectRoles } from '../../api/project';
import { updateSystemInfo } from '../../api/system_config';
import { Translation } from '../../components/Translation';
import i18n from '../../i18n';
import type { Project, ProjectRoleBase , DexConfig, SystemInfo , LoginUserInfo } from '@velaux/data';
import { locale } from '../../utils/locale';
import { checkPermission } from '../../utils/permission';
import { CustomSelect } from '../../components/CustomSelect';
import { If } from '../../components/If';
import Item from '../../components/Item';
import { Dispatch } from 'redux';

const { Col, Row } = Grid;

type Props = {
  onClose: () => void;
  syncPlatformSetting: () => void;
  systemInfo: SystemInfo;
  userInfo?: LoginUserInfo;
  dispatch: Dispatch;
};

type State = {
  businessGuideCode: number;
  dexConfig?: DexConfig;
  defaultProjectItems: Array<{ id: string; name?: string; roles?: string[] }>;
  projects?: Project[];
  roles?: ProjectRoleBase[];
};

type QuickShowRet = {
  hide: () => void;
};
@connect((store: any) => {
  return { ...store.user };
})
class PlatformSetting extends React.Component<Props, State> {
  field: Field;
  dialogGuideDex: QuickShowRet | undefined;
  dialogGuideUser: QuickShowRet | undefined;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this, {
      onChange: (name: string, value: any) => {
        if (name.endsWith('-name')) {
          this.loadProjectRoles(value);
        }
      },
    });
    this.state = {
      businessGuideCode: 0,
      defaultProjectItems: [],
    };
  }

  componentDidMount() {
    this.loadSystemInfo();
    this.listProjects();
    this.onGetDexConfig();
  }

  onGetDexConfig = () => {
    getDexConfig().then((res: DexConfig) => {
      if (res) {
        this.setState({
          dexConfig: res,
        });
      }
    });
  };

  loadSystemInfo = () => {
    this.props.dispatch({
      type: 'user/getSystemInfo',
      callback: (systemInfo: SystemInfo) => {
        this.field.setValues({
          loginType: systemInfo.loginType,
          enableCollection: systemInfo.enableCollection,
        });
        const items: Array<{ id: string; name: string; roles: string[] }> = [];
        systemInfo.dexUserDefaultProjects?.map((item) => {
          items.push({ id: uuid(), ...item });
        });
        this.setState({ defaultProjectItems: items });
      },
    });
  };

  onUpdate = () => {
    this.field.validate((errs: any, values: any) => {
      if (errs) {
        return;
      }
      const { enableCollection, loginType, velaAddress } = values;
      const projectMaps: Record<
        string,
        {
          name: string;
          roles: string[];
        }
      > = {};
      Object.keys(values).map((key) => {
        if (key.endsWith('-name')) {
          const infos = key.split('-');
          if (!projectMaps[infos[0]]) {
            projectMaps[infos[0]] = { name: values[key], roles: [] };
          } else {
            projectMaps[infos[0]].name = values[key];
          }
        }
        if (key.endsWith('-roles')) {
          const infos = key.split('-');
          if (!projectMaps[infos[0]]) {
            projectMaps[infos[0]] = { roles: values[key], name: '' };
          } else {
            projectMaps[infos[0]].roles = values[key];
          }
        }
      });

      const param = {
        enableCollection,
        loginType,
        velaAddress,
        dexUserDefaultProjects: Object.keys(projectMaps).map((key) => {
          return projectMaps[key];
        }),
      };
      updateSystemInfo(param)
        .then((res) => {
          if (res) {
            Message.success(i18n.t('Platform settings updated successfully'));
            this.loadSystemInfo();
          }
        })
        .catch((err) => {
          const businessGuideCode = err?.BusinessCode || 0;
          this.setState(
            {
              businessGuideCode: businessGuideCode,
            },
            () => {
              if (this.state.businessGuideCode === 12011) {
                this.renderDexGuideDialog();
              } else if (this.state.businessGuideCode === 14010) {
                this.renderUserGuideDialog();
              } else {
                Message.error(err?.Message);
              }
            }
          );
        });
    });
  };

  renderUserGuideDialog = () => {
    this.dialogGuideUser = Dialog.alert({
      title: i18n.t('The email address of administrator is empty').toString(),
      content: i18n.t('Please set a email address for the administrator, it must same as the SSO account.').toString(),
      footerActions: ['ok'],
      footer: this.getGuideUserButton(),
    });
    return this.dialogGuideUser;
  };

  renderDexGuideDialog = () => {
    this.dialogGuideDex = Dialog.alert({
      title: i18n.t('No dex connector configurations').toString(),
      content: i18n.t('Before enabling SSO, you must add at least one dex connector configuration.').toString(),
      footerActions: ['ok'],
      footer: this.getGuideDexButton(),
    });
    return this.dialogGuideDex;
  };

  getGuideUserButton = () => {
    const { userInfo } = this.props;
    const request = { resource: 'user:*', action: 'list' };
    const project = '';
    if (checkPermission(request, project, userInfo)) {
      return (
        <Button type="primary" onClick={this.onOKGuide}>
          <Translation>OK</Translation>
        </Button>
      );
    } else {
      return null;
    }
  };

  getGuideDexButton = () => {
    const { userInfo } = this.props;
    const request = { resource: 'configType:*', action: 'list' };
    const project = '';
    if (checkPermission(request, project, userInfo)) {
      return (
        <Button type="primary" onClick={this.onOKGuide}>
          <Translation>OK</Translation>
        </Button>
      );
    } else {
      return null;
    }
  };

  onOKGuide = () => {
    const { businessGuideCode } = this.state;
    if (businessGuideCode === 12011) {
      this.dialogGuideDex?.hide();
      this.props.dispatch(
        routerRedux.push({
          pathname: '/configs/dex-connector/config',
        })
      );
    } else if (businessGuideCode === 14010) {
      this.dialogGuideUser?.hide();
      this.props.dispatch(
        routerRedux.push({
          pathname: '/users',
        })
      );
    }
  };

  generateDexAddress = () => {
    if (!this.state.dexConfig) {
      return;
    }
    const { clientID, redirectURL } = this.state.dexConfig;
    const newRedirectURl = encodeURIComponent(redirectURL);
    return `${this.field.getValue(
      'velaAddress'
    )}/dex/auth?client_id=${clientID}&redirect_uri=${newRedirectURl}&response_type=code&scope=openid+profile+email+offline_access&state=velaux`;
  };

  onAddItem = () => {
    this.setState((prevState) => ({
      defaultProjectItems: [...prevState.defaultProjectItems, { id: uuid() }],
    }));
  };

  onRemoveItem = (id: string) => {
    this.setState((prevState) => ({
      defaultProjectItems: prevState.defaultProjectItems.filter((cp) => cp.id != id) || [],
    }));
    this.field.remove(`${id}-name`);
    this.field.remove(`${id}-roles`);
  };

  getIssuerDefaultValue = () => {
    const domain = `${window.location.protocol}//${window.location.host}`;
    return domain;
  };

  generateProjectOptions = () => {
    return this.state.projects?.map((item) => {
      return {
        label: `${item.name}(${item.alias || '-'})`,
        value: item.name,
      };
    });
  };

  generateProjectRoleOptions = () => {
    return this.state.roles?.map((item) => {
      return {
        label: `${item.name}(${item.alias || '-'})`,
        value: item.name,
      };
    });
  };

  listProjects = async () => {
    getProjectList({ page: 0, pageSize: 0 }).then((res) => {
      this.setState({
        projects: res.projects || [],
      });
    });
  };

  loadProjectRoles = async (name: string) => {
    getProjectRoles({ projectName: name }).then((res) => {
      this.setState({ roles: res?.roles || [] });
    });
  };

  render() {
    const { systemInfo } = this.props;
    const { defaultProjectItems } = this.state;
    return (
      <div className="container">
        <Card locale={locale().Card} contentHeight="auto" style={{ marginBottom: 'var(--spacing-4)' }}>
          <div className="setting-version">
            <Row>
              <Col span={12}>
                <Item label="Version" value={systemInfo.systemVersion?.velaVersion}></Item>
              </Col>
              <Col span={12}>
                <Item label="GitVersion" value={systemInfo.systemVersion?.gitVersion}></Item>
              </Col>
            </Row>
          </div>
        </Card>
        <Form field={this.field} labelCol={{ fixedSpan: 8 }} wrapperCol={{ span: 16 }}>
          <Card
            style={{ marginBottom: '16px' }}
            locale={locale().Card}
            contentHeight="200px"
            title={<Translation>User authentication configuration</Translation>}
          >
            <Row wrap={true}>
              <Col span={24}>
                <Form.Item required={true} label={i18n.t('User login mode').toString()}>
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
                <If condition={this.field.getValue('loginType') == 'dex'}>
                  <a href={this.generateDexAddress()} target="_blank" rel="noopener noreferrer">
                    <Translation>Click me to open the dex login page</Translation>
                  </a>
                </If>
              </Col>
              <Col span={24}>
                <Form.Item
                  required={true}
                  label={i18n.t('VelaUX address').toString()}
                  help={i18n.t('There will auto get the domain for access the VelaUX').toString()}
                >
                  <Input
                    {...this.field.init('velaAddress', {
                      initValue: this.getIssuerDefaultValue(),
                      rules: [{ required: true }],
                    })}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label={i18n.t('Setting the default projects for the dex login user').toString()}>
                  <div className="flexright" style={{ marginBottom: '8px' }}>
                    <Button onClick={this.onAddItem}>
                      <AiOutlinePlus />
                    </Button>
                  </div>
                  {defaultProjectItems.map((item) => {
                    return (
                      <Row id={item.id} key={item.id}>
                        <Col span={8} style={{ padding: '0 4px' }}>
                          <Form.Item labelAlign="inset" required={true} label={i18n.t('Project').toString()}>
                            <Select
                              locale={locale().Select}
                              {...this.field.init(`${item.id}-name`, {
                                rules: [{ required: true }],
                                initValue: item.name,
                              })}
                              dataSource={this.generateProjectOptions()}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12} style={{ padding: '0 4px' }}>
                          <Form.Item labelAlign="inset" required={true} label={i18n.t('Roles').toString()}>
                            <CustomSelect
                              locale={locale().Select}
                              {...this.field.init(`${item.id}-roles`, {
                                rules: [{ required: true }],
                                initValue: item.roles,
                              })}
                              dataSource={this.generateProjectRoleOptions()}
                              mode="multiple"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <div className="flexright">
                            <Button onClick={() => this.onRemoveItem(item.id)}>
                              <AiOutlineDelete />
                            </Button>
                          </div>
                        </Col>
                      </Row>
                    );
                  })}
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card
            style={{ marginBottom: '16px' }}
            locale={locale().Card}
            contentHeight="200px"
            title={
              <span>
                <Translation>User experience improvement plan</Translation>
                <a
                  target="_blank"
                  href="https://kubevela.io/docs/reference/user-improvement-plan"
                  rel="noopener noreferrer"
                >
                  <MdOutlineHelpCenter size={16} style={{ marginLeft: '4px' }}></MdOutlineHelpCenter>
                </a>
              </span>
            }
          >
            <Item
              label={i18n.t('Contribution')}
              value={
                <Switch
                  size="medium"
                  {...this.field.init('enableCollection', {
                    rules: [{ required: true }],
                    initValue: systemInfo.enableCollection,
                  })}
                  checked={this.field.getValue('enableCollection')}
                />
              }
            />
          </Card>
          <div className="flexright">
            <Button type="primary" onClick={this.onUpdate}>
              <Translation>Submit</Translation>
            </Button>
          </div>
        </Form>
      </div>
    );
  }
}

export default PlatformSetting;
