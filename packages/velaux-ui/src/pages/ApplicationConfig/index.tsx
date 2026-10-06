import { Grid, Button, Message, Dialog, Loading } from '@alifd/next';
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
  getSources,
  deleteSource,
} from '../../api/application';
import { getComponentDefinitions, getPolicyDefinitions } from '../../api/definitions';
import { deployNamespaces } from '../../utils/restrictions';
import { If } from '../../components/If';
import Permission from '../../components/Permission';
import { Title } from '../../components/Title';
import type { EnvironmentStatus } from '../ApplicationList/components/AppStatus/health';
import { OrbitCards } from '../ApplicationEnvironments';
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
  ApplicationEnvStatus,
  DefinitionBase,
  ApplicationSource,
} from '@velaux/data';
import { beautifyTime, momentDate } from '../../utils/common';
import type { APIError } from '../../utils/errors';
import { handleError } from '../../utils/errors';
import { locale } from '../../utils/locale';
import EditAppDialog from '../ApplicationList/components/EditAppDialog';

import ComponentDialog from './components/ComponentDialog';
import ComponentList from './components/ComponentList';
import { dependencyItems } from '../../utils/dependencies';
import PolicyDialog from './components/PolicyDialog';
import PolicyList from './components/PolicyList';
import SourceDialog from './components/SourceDialog';
import SourceList from './components/SourceList';
import TraitDialog from './components/TraitDialog';
import TriggerDialog from './components/TriggerDialog';
import TriggerList from './components/TriggerList';

const { Row, Col } = Grid;

type Props = {
  applicationAllStatus?: ApplicationEnvStatus[];
  match: {
    params: {
      appName: string;
      section?: string;
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
  policyScopes?: Record<string, string>;
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
  sources: ApplicationSource[];
  visibleSource: boolean;
  editSource?: ApplicationSource;
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
      sources: [],
      visibleSource: false,
    };
  }

  componentDidMount() {
    this.onGetApplicationTrigger();
    this.onGetComponentDefinitions();
    this.onGetPolicyScopes();
    this.loadAppStatistics();
    this.loadSources();
  }

  componentDidUpdate(prevProps: Props) {
    if (deployNamespaces(prevProps.envbinding).join(',') !== deployNamespaces(this.props.envbinding).join(',')) {
      this.onGetComponentDefinitions();
    }
  }

  loadSources = () => {
    getSources(this.state.appName).then((res: { sources?: ApplicationSource[] }) => {
      if (res) {
        this.setState({ sources: res.sources || [] });
      }
    });
  };

  onDeleteSource = (name: string) => {
    deleteSource(this.state.appName, name).then((res: any) => {
      if (res) {
        Message.success('Application source deleted successfully');
        this.loadSources();
      }
    });
  };

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
    const {
      alias = '',
      description = '',
      name = '',
      createTime = '',
      icon = '',
      labels,
      annotations,
    } = applicationDetail || {};
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

  // onGetPolicyScopes finds how KubeVela applies each policy type, which the
  // policy list marks.
  onGetPolicyScopes = () => {
    getPolicyDefinitions().then((res: { definitions?: DefinitionBase[] }) => {
      const scopes: Record<string, string> = {};
      (res?.definitions || []).forEach((def) => {
        if (def.policyScope) {
          scopes[def.name] = def.policyScope;
        }
      });
      this.setState({ policyScopes: scopes });
    });
  };

  // definitionsRequest numbers the component definition requests, so only the
  // latest may set the list: an earlier one asked about other namespaces.
  definitionsRequest = 0;

  onGetComponentDefinitions = async () => {
    const namespaces = deployNamespaces(this.props.envbinding);
    const request = ++this.definitionsRequest;
    // Until the environments load there is no namespace to check restrictions
    // against, and an unfiltered list offers types the webhook then refuses.
    if (namespaces.length === 0) {
      this.setState({ componentDefinitions: [] });
      return;
    }
    getComponentDefinitions(namespaces).then((res) => {
      if (res && request === this.definitionsRequest) {
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
      sources,
      visibleSource,
      editSource,
    } = this.state;
    const projectName = (applicationDetail && applicationDetail.project?.name) || '';
    const dependencyEdges = (this.props.applicationAllStatus || []).flatMap((s) => s.status?.dependencies || []);
    // section is the tab shown; without one the page is the overview.
    const section = this.props.match.params.section;
    if (!applicationDetail) {
      return <Loading visible />;
    }
    return (
      <div>
        {!section && (
          <div className="app-overview">
            <div className="app-overview-about">
              <div className="app-overview-head">
                <span className="app-overview-title">
                  <Translation>About</Translation>
                </span>
                <div className="app-overview-actions">
                  <Permission
                    request={{ resource: `project:${projectName}/application/:${appName}`, action: 'update' }}
                    project={projectName}
                  >
                    <Button onClick={this.editAppPlan}>
                      <Translation>Edit</Translation>
                    </Button>
                  </Permission>
                  <Permission
                    request={{ resource: `project:${projectName}/application/:${appName}`, action: 'delete' }}
                    project={projectName}
                  >
                    <Button className="danger-btn" onClick={this.onDeleteApplication}>
                      <Translation>Remove</Translation>
                    </Button>
                  </Permission>
                </div>
              </div>
              <p className={`app-overview-description ${applicationDetail?.description ? '' : 'empty'}`}>
                {applicationDetail?.description || <Translation>No description</Translation>}
              </p>
              <div className="app-overview-facts">
                <div>
                  <span>
                    <Translation>Project</Translation>
                  </span>
                  <Link to={`/projects/${applicationDetail?.project?.name}`}>
                    {applicationDetail?.project?.alias || applicationDetail?.project?.name}
                  </Link>
                </div>
                <div>
                  <span>
                    <Translation>Created</Translation>
                  </span>
                  <span title={momentDate(applicationDetail.createTime)}>
                    {beautifyTime(applicationDetail.createTime)}
                  </span>
                </div>
                <div>
                  <span>
                    <Translation>Updated</Translation>
                  </span>
                  <span title={momentDate(applicationDetail.updateTime)}>
                    {beautifyTime(applicationDetail.updateTime)}
                  </span>
                </div>
              </div>
              {applicationDetail?.labels && Object.keys(applicationDetail.labels).length > 0 && (
                <div className="app-overview-labels">
                  {Object.keys(applicationDetail.labels).map((key) => (
                    <span key={key} className="resource-chip">{`${key}=${applicationDetail.labels?.[key]}`}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="app-overview-stats">
              {[
                { n: statistics?.envCount, label: 'Environments', to: 'environments' },
                { n: statistics?.targetCount, label: 'Targets', to: 'environments' },
                { n: components?.length, label: 'Components', to: 'config/components' },
                { n: statistics?.workflowCount, label: 'Workflows', to: 'workflows' },
                { n: statistics?.revisionCount, label: 'Revisions', to: 'revisions' },
              ].map((stat) => (
                <Link key={stat.label} className="app-overview-stat" to={`/applications/${appName}/${stat.to}`}>
                  <span className="app-overview-stat-n">{stat.n ?? '-'}</span>
                  <Translation>{stat.label}</Translation>
                </Link>
              ))}
            </div>

            <div className="app-overview-section">
              <Translation>Environments</Translation>
            </div>
            <OrbitCards
              appName={appName}
              envbinding={envbinding || []}
              applicationAllStatus={(this.props.applicationAllStatus || []) as EnvironmentStatus[]}
              dispatch={this.props.dispatch}
            />
          </div>
        )}
        <Row wrap={true} className="app-spec">
          {section === 'sources' && (
            <Col span={24} className="app-spec-item">
              <Row>
                <Col span={24} className="padding16">
                  <Title
                    title={
                      <span className="app-section-hint">
                        <Translation>What the application reads when it deploys, as $(source.name).</Translation>
                      </span>
                    }
                    actions={[
                      <Permission
                        request={{
                          resource: `project:${projectName}/application:${applicationDetail?.name}/source:*`,
                          action: 'create',
                        }}
                        project={projectName}
                      >
                        <Button
                          key={'add'}
                          type="primary"
                          onClick={() => this.setState({ visibleSource: true, editSource: undefined })}
                        >
                          <Translation>New Source</Translation>
                        </Button>
                      </Permission>,
                    ]}
                  />
                </Col>
              </Row>
              <SourceList
                sources={sources}
                applicationDetail={applicationDetail}
                onDeleteSource={this.onDeleteSource}
                onShowSource={(source: ApplicationSource) => this.setState({ visibleSource: true, editSource: source })}
              />
            </Col>
          )}
          {section === 'components' && (
            <Col span={24} className="app-spec-item">
              <Row>
                <Col span={24} className="padding16">
                  <Title
                    title={
                      <span className="app-section-hint">
                        <Translation>What the application runs, and the traits that shape each one.</Translation>
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
                              <Button key={'add'} type="primary" onClick={this.onAddComponent}>
                                <Translation>New Component</Translation>
                              </Button>
                            </Permission>,
                          ]
                        : []
                    }
                  />
                </Col>
              </Row>

              <ComponentList
                application={applicationDetail}
                components={components || []}
                statuses={(this.props.applicationAllStatus || []) as any}
                editComponent={(component: ApplicationComponentBase) => this.editComponent(component)}
                onDeleteComponent={(component: string) => this.onDeleteComponent(component)}
                onDeleteTrait={this.onDeleteTrait}
                onAddTrait={(name: string) => this.onAddTrait(name, true)}
                changeTraitStats={this.changeTraitStats}
              />
            </Col>
          )}
          {section === 'policies' && (
            <Col span={24} className="app-spec-item">
              <Row>
                <Col span={24} className="padding16">
                  <Title
                    title={
                      <span className="app-section-hint">
                        <Translation>Where the application deploys, and what it overrides there.</Translation>
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
                        <Button key={'add'} type="primary" onClick={this.onAddPolicy}>
                          <Translation>New Policy</Translation>
                        </Button>
                      </Permission>,
                    ]}
                  />
                </Col>
              </Row>
              <PolicyList
                policies={policies}
                statuses={this.props.applicationAllStatus}
                policyScopes={this.state.policyScopes}
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
          )}
          {section === 'triggers' && (
            <Col span={24} className="app-spec-item">
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
                        <Button key={'add'} type="primary" onClick={this.onAddTrigger}>
                          <Translation>New Trigger</Translation>
                        </Button>
                      </Permission>,
                    ]}
                    title={
                      <span className="app-section-hint">
                        <Translation>Webhooks that start a workflow from outside.</Translation>
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
          )}
        </Row>

        <If condition={visibleTrait}>
          <TraitDialog
            project={applicationDetail?.project?.name || ''}
            deployed={statistics ? (statistics.revisionCount || 0) > 0 : undefined}
            visible={visibleTrait}
            isEditComponent={isEditComponent}
            appName={appName}
            componentName={componentName}
            isEditTrait={isEditTrait}
            traitItem={traitItem}
            temporaryTraitList={temporaryTraitList}
            envbinding={envbinding || []}
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
            deployed={statistics ? (statistics.revisionCount || 0) > 0 : undefined}
            appName={appName}
            componentName={componentName}
            components={components || []}
            dependencies={dependencyItems(componentName, dependencyEdges)}
            dependencyEdges={dependencyEdges}
            isEditComponent={isEditComponent}
            temporaryTraitList={temporaryTraitList}
            componentDefinitions={componentDefinitions}
            onComponentClose={this.onComponentClose}
            onComponentOK={this.onComponentOK}
          />
        </If>
        <If condition={visibleSource}>
          <SourceDialog
            project={applicationDetail?.project?.name || ''}
            appName={appName}
            source={editSource}
            envbinding={envbinding}
            onClose={() => this.setState({ visibleSource: false, editSource: undefined })}
            onOK={() => {
              this.loadSources();
              this.setState({ visibleSource: false, editSource: undefined });
            }}
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
