import { Grid, Button, Card, Message, Dialog, Balloon, Tag, Loading } from '@alifd/next';
import React, { Component } from 'react';
import './index.less';
import { connect } from 'dva';

import {
  deleteTrait,
  getApplicationTriggers,
  deleteTrigger,
  deleteComponent,
  deleteApplication,
  deletePolicy,
  getPolicyDetail,
  getApplicationStatistics,
} from '../../api/application';
import { getComponentDefinitions } from '../../api/definitions';
import { If } from '../../components/If';
import Item from '../../components/Item';
import NumItem from '../../components/NumItem';
import Permission from '../../components/Permission';
import { Title } from '../../components/Title';
import { Translation } from '../../components/Translation';
import { routerRedux, Link } from 'dva/router';
import i18n from '../../i18n';
import type {
  ApplicationPolicyDetail,
  ApplicationStatistics,
  ApplicationDetail,
  Trait,
  ApplicationComponent,
  EnvBinding,
  Trigger,
  Workflow,
  ApplicationBase,
  ApplicationComponentBase,
  ApplicationPolicyBase,
} from '@velaux/data';
import { beautifyTime, momentDate, showAlias } from '../../utils/common';
import type { APIError } from '../../utils/errors';
import { handleError } from '../../utils/errors';
import { locale } from '../../utils/locale';
import EditAppDialog from '../ApplicationList/components/EditAppDialog';

import ComponentDialog from './components/ComponentDialog';
import Components from './components/Components';
import PolicyDialog from './components/PolicyDialog';
import PolicyList from './components/PolicyList';
import TraitDialog from './components/TraitDialog';
import TriggerDialog from './components/TriggerDialog';
import TriggerList from './components/TriggerList';

const { Row, Col } = Grid;

type Props = {
  match: {
    params: {
      appName: string;
    };
  };
  history: {
    push: (path: string, state: {}) => {};
  };
  dispatch: ({}) => {};
  applicationDetail?: ApplicationDetail;
  components?: ApplicationComponentBase[];
  policies?: ApplicationPolicyBase[];
  componentsApp?: string;
  envbinding?: EnvBinding[];
  workflows?: Workflow[];
};

type State = {
  appName: string;
  componentName: string;
  visibleTrait: boolean;
  isEditTrait: boolean;
  mainComponent?: ApplicationComponent;
  traitItem: Trait;
  triggers: Trigger[];
  trigger?: Trigger;
  visibleTrigger: boolean;
  createTriggerInfo: Trigger;
  showEditApplication: boolean;
  editItem?: ApplicationBase;
  visibleComponent: boolean;
  temporaryTraitList: Trait[];
  isEditComponent: boolean;
  componentDefinitions: [];
  visiblePolicy: boolean;
  showPolicyName?: string;
  policyDetail?: ApplicationPolicyDetail;
  statistics?: ApplicationStatistics;
};
@connect((store: any) => {
  return { ...store.application };
})
class ApplicationConfig extends Component<Props, State> {
  constructor(props: any) {
    super(props);
    const { params } = props.match;
    this.state = {
      appName: params.appName,
      componentName: '',
      isEditTrait: false,
      visibleTrait: false,
      traitItem: { type: '' },
      triggers: [],
      visibleTrigger: false,
      createTriggerInfo: { name: '', workflowName: '', type: 'webhook', token: '' },
      showEditApplication: false,
      visibleComponent: false,
      temporaryTraitList: [],
      isEditComponent: false,
      componentDefinitions: [],
      visiblePolicy: false,
    };
  }

  componentDidMount() {
    this.onGetApplicationTrigger();
    this.onGetComponentDefinitions();
    this.loadAppStatistics();
  }

  onGetApplicationTrigger() {
    const { appName } = this.state;
    const params = {
      appName,
    };
    getApplicationTriggers(params).then((res: any) => {
      if (res) {
        this.setState({
          triggers: res.triggers || [],
        });
      }
    });
  }

  loadAppStatistics = async () => {
    const { appName } = this.state;
    if (appName) {
      getApplicationStatistics({ appName: appName }).then((re: ApplicationStatistics) => {
        if (re) {
          this.setState({ statistics: re });
        }
      });
    }
  };

  onDeleteTrait = async (componentName: string, traitType: string) => {
    const { appName } = this.state;
    const params = {
      appName,
      componentName,
      traitType,
    };
    Dialog.confirm({
      type: 'confirm',
      content: <Translation>Unrecoverable after deletion, are you sure to delete it?</Translation>,
      onOk: () => {
        deleteTrait(params).then((res: any) => {
          if (res) {
            Message.success({
              duration: 4000,
              content: i18n.t('Trait deleted successfully').toString(),
            });
            this.onLoadApplicationComponents();
          }
        });
      },
      locale: locale().Dialog,
    });
  };

  onClose = () => {
    this.setState({ visibleTrait: false, isEditTrait: false });
  };

  onOk = () => {
    this.onLoadApplicationComponents();
    this.setState({
      isEditTrait: false,
      visibleTrait: false,
    });
  };

  onAddTrait = (componentName?: string, isEditComponent?: boolean) => {
    this.setState({
      visibleTrait: true,
      traitItem: { type: '' },
      isEditTrait: false,
      componentName: componentName || '',
      isEditComponent: isEditComponent || false,
    });
  };

  changeTraitStats = (isEditTrait: boolean, traitItem: Trait, componentName: string) => {
    this.setState({
      visibleTrait: true,
      isEditTrait,
      isEditComponent: true,
      traitItem,
      componentName: componentName,
    });
  };

  onAddTrigger = () => {
    this.setState({
      visibleTrigger: true,
    });
  };

  onTriggerClose = () => {
    this.setState({
      visibleTrigger: false,
      trigger: undefined,
    });
    this.onLoadApplicationComponents();
  };

  onTriggerOk = (res: Trigger) => {
    this.onGetApplicationTrigger();
    this.setState({
      visibleTrigger: false,
      trigger: undefined,
      createTriggerInfo: res,
    });
  };

  onDeleteTrigger = async (token: string) => {
    const { appName } = this.state;
    const params = {
      appName,
      token,
    };
    deleteTrigger(params).then((res: any) => {
      if (res) {
        Message.success({
          duration: 4000,
          content: 'Trigger deleted successfully.',
        });
        this.onGetApplicationTrigger();
      }
    });
  };

  editAppPlan = () => {
    const { applicationDetail } = this.props;
    const { alias = '', description = '', name = '', createTime = '', icon = '', labels, annotations } = applicationDetail || {};
    this.setState({
      editItem: {
        name,
        alias,
        description,
        createTime,
        icon,
        labels,
        annotations,
      },
      showEditApplication: true,
    });
  };

  onOkEditAppDialog = () => {
    this.setState({
      showEditApplication: false,
    });
    this.onGetApplicationDetails();
  };

  onCloseEditAppDialog = () => {
    this.setState({
      showEditApplication: false,
    });
  };

  editComponent = (component: ApplicationComponentBase) => {
    this.setState({
      isEditComponent: true,
      visibleComponent: true,
      componentName: component.name,
    });
  };

  onAddComponent = () => {
    this.setState({
      visibleComponent: true,
      isEditComponent: false,
      componentName: '',
    });
  };

  onAddPolicy = () => {
    this.setState({ visiblePolicy: true });
  };

  onDeleteComponent = async (componentName: string) => {
    const { appName } = this.state;
    const params = {
      appName,
      componentName,
    };
    deleteComponent(params).then((res: any) => {
      if (res) {
        Message.success({
          duration: 4000,
          title: i18n.t('Success').toString(),
          content: i18n.t('Delete component success.').toString(),
        });
        this.onLoadApplicationComponents();
      }
    });
  };

  createTemporaryTrait = (trait: Trait) => {
    this.setState({
      temporaryTraitList: [...this.state.temporaryTraitList, trait],
      visibleTrait: false,
    });
  };

  upDateTemporaryTrait = (trait: Trait) => {
    const { temporaryTraitList } = this.state;
    const updateTraitList: Trait[] = [];
    (temporaryTraitList || []).map((item) => {
      let newTraitItem: Trait = { type: '' };
      if (item.type === trait.type) {
        newTraitItem = trait;
      } else {
        newTraitItem = item;
      }
      updateTraitList.push(newTraitItem);
    });

    this.setState({
      temporaryTraitList: updateTraitList,
      visibleTrait: false,
    });
  };

  onComponentClose = () => {
    this.setState({
      visibleComponent: false,
      temporaryTraitList: [],
    });
    this.onLoadApplicationComponents();
  };

  onComponentOK = () => {
    this.setState(
      {
        visibleComponent: false,
        temporaryTraitList: [],
      },
      () => {
        this.onLoadApplicationComponents();
      }
    );
  };

  onGetComponentDefinitions = async () => {
    getComponentDefinitions().then((res) => {
      if (res) {
        this.setState({
          componentDefinitions: res && res.definitions,
        });
      }
    });
  };

  onGetApplicationDetails = async () => {
    const { appName } = this.state;
    this.props.dispatch({
      type: 'application/getApplicationDetail',
      payload: { appName: appName },
    });
  };

  onLoadApplicationComponents = async () => {
    const { appName } = this.state;
    this.props.dispatch({
      type: 'application/getApplicationComponents',
      payload: { appName: appName },
    });
  };

  onDeleteApplication = () => {
    const { appName } = this.state;
    Dialog.confirm({
      type: 'confirm',
      content: <Translation>Unrecoverable after deletion, are you sure to delete it?</Translation>,
      onOk: () => {
        deleteApplication({ name: appName }).then((re) => {
          if (re) {
            Message.success('Application deleted successfully');
            this.props.dispatch(routerRedux.push('/applications'));
          }
        });
      },
      locale: locale().Dialog,
    });
  };

  onDeletePolicy = (policyName: string) => {
    const { appName } = this.state;
    deletePolicy({ appName: appName, policyName: policyName })
      .then((re) => {
        if (re) {
          Message.success('Application policy deleted successfully');
          this.loadApplicationPolicies();
        }
      })
      .catch((err: APIError) => {
        if (err.BusinessCode === 10026) {
          Dialog.confirm({
            type: 'confirm',
            content: <Translation>This policy is being used by workflow, do you want to force delete it?</Translation>,
            onOk: () => {
              deletePolicy({ appName: appName, policyName: policyName, force: true }).then((res: any) => {
                if (res) {
                  Message.success('Application policy deleted successfully');
                  this.loadApplicationPolicies();
                }
              });
            },
            locale: locale().Dialog,
          });
        } else {
          handleError(err);
        }
      });
  };

  onEditPolicy = (policyName: string) => {
    const { appName } = this.state;
    getPolicyDetail({ appName, policyName }).then((res: ApplicationPolicyDetail) => {
      if (res) {
        this.setState({ policyDetail: res, visiblePolicy: true });
      }
    });
  };

  loadApplicationPolicies = async () => {
    const {
      params: { appName },
    } = this.props.match;
    this.props.dispatch({
      type: 'application/getApplicationPolicies',
      payload: { appName: appName },
    });
  };

  render() {
    const { applicationDetail, workflows, components, policies, envbinding } = this.props;
    const {
      visibleTrait,
      isEditTrait,
      appName = '',
      componentName = '',
      traitItem,
      triggers,
      trigger,
      visibleTrigger,
      createTriggerInfo,
      showEditApplication,
      editItem,
      visibleComponent,
      temporaryTraitList,
      isEditComponent,
      componentDefinitions,
      visiblePolicy,
      policyDetail,
      statistics,
    } = this.state;
    const projectName = (applicationDetail && applicationDetail.project?.name) || '';
    if (!applicationDetail) {
      return <Loading visible />;
    }
    return (
      <div>
        <Row className="flex-row" wrap={true}>
          <Col xl={16} l={24} s={24} style={{ padding: '0 8px' }}>
            <Card locale={locale().Card} contentHeight="auto" subTitle={applicationDetail?.description}>
              <Row wrap={true}>
                <Col xxs={12}>
                  <div className="app-name">{showAlias(applicationDetail?.name, applicationDetail?.alias)}</div>
                </Col>
                <Col xxs={12} className="flexright" style={{ marginBottom: '16px' }}>
                  <div>
                    <Permission
                      request={{
                        resource: `project:${projectName}/application/:${appName}`,
                        action: 'delete',
                      }}
                      project={projectName}
                    >
                      <Button
                        className="danger-btn"
                        style={{ marginRight: '16px' }}
                        onClick={this.onDeleteApplication}
                        type="secondary"
                      >
                        <Translation>Remove</Translation>
                      </Button>
                    </Permission>
                    <Permission
                      request={{
                        resource: `project:${projectName}/application/:${appName}`,
                        action: 'update',
                      }}
                      project={projectName}
                    >
                      <Button onClick={this.editAppPlan} type="secondary">
                        <Translation>Edit</Translation>
                      </Button>
                    </Permission>
                  </div>
                </Col>

                <Col l={8} xs={24}>
                  <Item
                    label={<Translation>Project</Translation>}
                    value={
                      <Link to={`/projects/${applicationDetail?.project?.name}`}>
                        {applicationDetail?.project?.alias
                          ? applicationDetail?.project?.alias
                          : applicationDetail?.project?.name}
                      </Link>
                    }
                  />
                </Col>

                <Col l={8} xs={24}>
                  <Item
                    label={<Translation>Create Time</Translation>}
                    value={
                      <Balloon trigger={<span>{beautifyTime(applicationDetail.createTime)}</span>}>
                        {momentDate(applicationDetail.createTime) || '-'}
                      </Balloon>
                    }
                  />
                </Col>

                <Col l={8} xs={24}>
                  <Item
                    label={<Translation>Update Time</Translation>}
                    value={
                      <Balloon trigger={<span>{beautifyTime(applicationDetail.updateTime)}</span>}>
                        {momentDate(applicationDetail.updateTime) || '-'}
                      </Balloon>
                    }
                  />
                </Col>

                <Col xxs={24}>
                  {applicationDetail?.labels &&
                    Object.keys(applicationDetail?.labels).map((key) => {
                      if (applicationDetail?.labels) {
                        return (
                          <Tag
                            key={key}
                            style={{ margin: '4px' }}
                            color="blue"
                          >{`${key}=${applicationDetail?.labels[key]}`}</Tag>
                        );
                      }
                      return;
                    })}
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xl={8} l={24} s={24} style={{ padding: '0 8px' }}>
            <Card locale={locale().Card} contentHeight="auto" style={{ height: '100%' }}>
              <Row>
                <Col span={6} style={{ padding: '22px 0' }}>
                  <NumItem number={statistics?.envCount} title={i18n.t('Environment Count').toString()} />
                </Col>
                <Col span={6} style={{ padding: '22px 0' }}>
                  <NumItem number={statistics?.targetCount} title={i18n.t('Target Count').toString()} />
                </Col>
                <Col span={6} style={{ padding: '22px 0' }}>
                  <NumItem
                    number={statistics?.revisionCount}
                    to={`/applications/${applicationDetail.name}/revisions`}
                    title={i18n.t('Revision Count').toString()}
                  />
                </Col>
                <Col span={6} style={{ padding: '22px 0' }}>
                  <NumItem
                    number={statistics?.workflowCount}
                    to={`/applications/${applicationDetail.name}/workflows`}
                    title={i18n.t('Workflow Count').toString()}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        <Row wrap={true} className="app-spec">
          <Col xl={8} xxs={24} className="app-spec-item">
            <Row>
              <Col span={24} className="padding16">
                <Title
                  title={
                    <span className="font-size-16 font-weight-bold">
                      <Translation>Components</Translation>
                    </span>
                  }
                  actions={
                    !applicationDetail?.readOnly
                      ? [
                          <Permission
                            request={{
                              resource: `project:${projectName}/application:${applicationDetail?.name}/component:*`,
                              action: 'create',
                            }}
                            project={projectName}
                          >
                            <a key={'add'} onClick={this.onAddComponent} className="font-size-14 font-weight-400">
                              <Translation>New Component</Translation>
                            </a>
                          </Permission>,
                        ]
                      : []
                  }
                />
              </Col>
            </Row>

            <Components
              application={applicationDetail}
              components={components || []}
              editComponent={(component: ApplicationComponentBase) => {
                this.editComponent(component);
              }}
              onDeleteComponent={(component: string) => {
                this.onDeleteComponent(component);
              }}
              onDeleteTrait={this.onDeleteTrait}
              onAddTrait={(name: string) => {
                this.onAddTrait(name, true);
              }}
              onAddComponent={this.onAddComponent}
              changeTraitStats={this.changeTraitStats}
            />
          </Col>
          <Col xl={8} xxs={24} className="app-spec-item">
            <Row>
              <Col span={24} className="padding16">
                <Title
                  title={
                    <span className="font-size-16 font-weight-bold">
                      <Translation>Policies</Translation>
                    </span>
                  }
                  actions={[
                    <Permission
                      request={{
                        resource: `project:${projectName}/application:${applicationDetail?.name}/policy:*`,
                        action: 'create',
                      }}
                      project={projectName}
                    >
                      <a key={'add'} className="font-size-14 font-weight-400" onClick={this.onAddPolicy}>
                        <Translation>New Policy</Translation>
                      </a>
                    </Permission>,
                  ]}
                />
              </Col>
            </Row>
            <PolicyList
              policies={policies}
              envbinding={envbinding}
              applicationDetail={applicationDetail}
              onDeletePolicy={(name: string) => {
                this.onDeletePolicy(name);
              }}
              onShowPolicy={(name: string) => {
                this.onEditPolicy(name);
              }}
            />
          </Col>
          <Col xl={8} xxs={24} className="app-spec-item">
            <Row>
              <Col span={24} className="padding16">
                <Title
                  actions={[
                    <Permission
                      request={{
                        resource: `project:${projectName}/application:${applicationDetail?.name}/trigger:*`,
                        action: 'create',
                      }}
                      project={projectName}
                    >
                      <a key={'add'} className="font-size-14 font-weight-400" onClick={this.onAddTrigger}>
                        <Translation>New Trigger</Translation>
                      </a>
                    </Permission>,
                  ]}
                  title={
                    <span className="font-size-16 font-weight-bold">
                      <Translation>Triggers</Translation>
                    </span>
                  }
                />
              </Col>
            </Row>
            <TriggerList
              appName={appName}
              triggers={triggers}
              components={components || []}
              onDeleteTrigger={(token: string) => {
                this.onDeleteTrigger(token);
              }}
              createTriggerInfo={createTriggerInfo}
              applicationDetail={applicationDetail}
              onEditTrigger={(t: Trigger) => {
                this.setState({ visibleTrigger: true, trigger: t });
              }}
            />
          </Col>
        </Row>

        <If condition={visibleTrait}>
          <TraitDialog
            project={applicationDetail?.project?.name || ''}
            visible={visibleTrait}
            isEditComponent={isEditComponent}
            appName={appName}
            componentName={componentName}
            isEditTrait={isEditTrait}
            traitItem={traitItem}
            temporaryTraitList={temporaryTraitList}
            onClose={this.onClose}
            onOK={this.onOk}
            createTemporaryTrait={(trait: Trait) => {
              this.createTemporaryTrait(trait);
            }}
            upDateTemporaryTrait={(trait: Trait) => {
              this.upDateTemporaryTrait(trait);
            }}
          />
        </If>

        <If condition={visibleTrigger}>
          <TriggerDialog
            visible={visibleTrigger}
            appName={appName}
            trigger={trigger}
            workflows={workflows}
            components={components || []}
            onClose={this.onTriggerClose}
            onOK={(res: Trigger) => {
              this.onTriggerOk(res);
            }}
          />
        </If>

        <If condition={showEditApplication}>
          <EditAppDialog editItem={editItem} onOK={this.onOkEditAppDialog} onClose={this.onCloseEditAppDialog} />
        </If>

        <If condition={visibleComponent}>
          <ComponentDialog
            project={applicationDetail?.project?.name || ''}
            appName={appName}
            componentName={componentName}
            components={components || []}
            isEditComponent={isEditComponent}
            temporaryTraitList={temporaryTraitList}
            componentDefinitions={componentDefinitions}
            onComponentClose={this.onComponentClose}
            onComponentOK={this.onComponentOK}
          />
        </If>
        <If condition={visiblePolicy}>
          <PolicyDialog
            project={applicationDetail?.project?.name || ''}
            visible={visiblePolicy}
            appName={appName}
            policy={policyDetail}
            envbinding={envbinding || []}
            workflows={workflows || []}
            onClose={() => {
              this.setState({ visiblePolicy: false, policyDetail: undefined });
            }}
            onOK={() => {
              this.loadApplicationPolicies();
              this.setState({ visiblePolicy: false, policyDetail: undefined });
            }}
          />
        </If>
      </div>
    );
  }
}

export default ApplicationConfig;
