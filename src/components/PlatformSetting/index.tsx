import React from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { Field, Grid, Radio, Input, Message, Icon, Switch, Select } from '@b-design/ui';
import { Dialog, Card, Button, Form } from '@b-design/ui';
import Translation from '../../components/Translation';
import locale from '../../utils/locale';
import i18n from '../../i18n';
import type { DexConfig, SystemInfo } from '../../interface/system';
import type { LoginUserInfo } from '../../interface/user';
import { updateSystemInfo } from '../../api/config';
import { checkPermission } from '../../utils/permission';
import Item from '../Item';
import { If } from 'tsx-control-statements/components';
import { getDexConfig } from '../../api/authentication';
import { v4 as uuid } from 'uuid';
import { AiOutlineDelete, AiOutlinePlus } from 'react-icons/ai';
import { getProjectList, getProjectRoles } from '../../api/project';
import type { Project, ProjectRoleBase } from '../../interface/project';
import { CustomSelect } from '../CustomSelect';
const { Col, Row } = Grid;

type Props = {
  onClose: () => void;
  syncPlatformSetting: () => void;
  systemInfo: SystemInfo;
  userInfo?: LoginUserInfo;
  platformSetting: boolean;
  dispatch: ({}) => {};
};

type State = {
  businessGuideCode: number;
  dexConfig?: DexConfig;
  defaultProjectItems: { id: string; name?: string; roles?: string[] }[];
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
    this.listProjects();
    this.onGetDexConfig();
    this.field.setValues({
      loginType: this.props.systemInfo.loginType,
      enableCollection: this.props.systemInfo.enableCollection,
    });
    const items: { id: string; name: string; roles: string[] }[] = [];
    this.props.systemInfo.dexUserDefaultProjects?.map((item) => {
      items.push({ id: uuid(), ...item });
    });
    this.setState({ defaultProjectItems: items });
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
            Message.success(i18n.t('Update the platform configuration success'));
            this.props.syncPlatformSetting();
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
            },
          );
        });
    });
  };

  renderUserGuideDialog = () => {
    this.dialogGuideUser = Dialog.alert({
      title: i18n.t('The email address of administrator is empty'),
      content: i18n.t(
        'Please set a email address for the administrator, it must same as the SSO account.',
      ),
      footerActions: ['ok'],
      footer: this.getGuideUserButton(),
    });
    return this.dialogGuideUser;
  };

  renderDexGuideDialog = () => {
    this.dialogGuideDex = Dialog.alert({
      title: i18n.t('No dex connector configurations'),
      content: i18n.t(
        'Before enabling SSO, you must add at least one dex connector configuration.',
      ),
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
      this.props.onClose();
      this.props.dispatch(
        routerRedux.push({
          pathname: '/integrations/config-dex-connector/config',
        }),
      );
    } else if (businessGuideCode === 14010) {
      this.dialogGuideUser?.hide();
      this.props.onClose();
      this.props.dispatch(
        routerRedux.push({
          pathname: '/users',
        }),
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
      'velaAddress',
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
    const { onClose, platformSetting, systemInfo } = this.props;
    const { defaultProjectItems } = this.state;
    return (
      <Dialog
        locale={locale().Dialog}
        visible={platformSetting}
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
            locale={locale().Card}
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
                <If condition={this.field.getValue('loginType') == 'dex'}>
                  <a href={this.generateDexAddress()} target="_blank">
                    <Translation>Click me to test open the dex page.</Translation>
                  </a>
                </If>
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
              <Col span={24}>
                <Form.Item label={i18n.t('Default projects for the dex login user')}>
                  <div className="flexright" style={{ marginBottom: '8px' }}>
                    <Button onClick={this.onAddItem}>
                      <AiOutlinePlus />
                    </Button>
                  </div>
                  {defaultProjectItems.map((item) => {
                    return (
                      <Row id={item.id} key={item.id}>
                        <Col span={8} style={{ padding: '0 4px' }}>
                          <Form.Item labelAlign="inset" required={true} label={i18n.t('Project')}>
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
                          <Form.Item labelAlign="inset" required={true} label={i18n.t('Roles')}>
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
                <a target="_blank" href="https://kubevela.io/docs/reference/user-improvement-plan">
                  <Icon style={{ marginLeft: '4px' }} type="help" />
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
        </Form>
      </Dialog>
    );
  }
}

export default PlatformSetting;
