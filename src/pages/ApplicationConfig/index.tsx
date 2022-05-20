import React, { Component } from 'react';
import { Grid, Button, Card, Message, Dialog } from '@b-design/ui';
import './index.less';
import { connect } from 'dva';
import { If } from 'tsx-control-statements/components';
import {
  deleteTrait,
  getApplicationTriggers,
  deleteTriggers,
  deleteComponent,
  getComponentDefinitions,
  deleteApplicationPlan,
} from '../../api/application';
import Translation from '../../components/Translation';
import Title from '../../components/Title';
import { routerRedux } from 'dva/router';
import Item from '../../components/Item';
import TraitDialog from './components/TraitDialog';
import type {
  ApplicationDetail,
  Trait,
  ApplicationComponent,
  EnvBinding,
  Trigger,
  Workflow,
  ApplicationBase,
  ApplicationComponentBase,
  ApplicationPolicyBase,
} from '../../interface/application';

import { momentDate } from '../../utils/common';
import locale from '../../utils/locale';
import TriggerList from './components/TriggerList';
import TriggerDialog from './components/TriggerDialog';
import EditAppDialog from '../ApplicationList/components/EditAppDialog';
import Components from './components/Components';
import ComponentDialog from './components/ComponentDialog';
import i18n from '../../i18n';
import { Link } from 'dva/router';
import Permission from '../../components/Permission';
import PolicyList from './components/PolicyList';

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
              content: i18n.t('Trait deleted successfully'),
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
    });
    this.onLoadApplicationComponents();
  };

  onTriggerOk = (res: Trigger) => {
    this.onGetApplicationTrigger();
    this.setState({
      visibleTrigger: false,
      createTriggerInfo: res,
    });
  };

  onDeleteTrigger = async (token: string) => {
    const { appName } = this.state;
    const params = {
      appName,
      token,
    };
    deleteTriggers(params).then((res: any) => {
      if (res) {
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
    } = applicationDetail || {};
    this.setState({
      editItem: {
        name,
        alias,
        description,
        createTime,
        icon,
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
    });
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
          title: i18n.t('Success'),
          content: i18n.t('Delete component success.'),
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
      },
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
        deleteApplicationPlan({ name: appName }).then((re) => {
          if (re) {
            Message.success('Application deleted successfully');
            this.props.dispatch(routerRedux.push('/applications'));
          }
        });
      },
      locale: locale().Dialog,
    });
  };

  render() {
    const { applicationDetail, workflows, components, policies, envbinding } = this.props;
    const {
      visibleTrait,
      isEditTrait,
      appName = '',
      componentName = '',
      mainComponent,
      traitItem,
      triggers,
      visibleTrigger,
      createTriggerInfo,
      showEditApplication,
      editItem,
      visibleComponent,
      temporaryTraitList,
      isEditComponent,
      componentDefinitions,
    } = this.state;

    return (
      <div>
        <Row wrap={true}>
          <Col xl={12} xs={24} style={{ padding: '0 16px' }}>
            <Message
              type="notice"
              title={i18n.t(
                'Note that baseline configuration changes will be applied to all environments',
              )}
            />
          </Col>
          <Col xl={12} xs={24} style={{ padding: '0 16px' }} className="flexright">
            <Permission
              request={{ resource: `project/application/:${appName}`, action: 'delete' }}
              project={`${applicationDetail && applicationDetail.project?.name}`}
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
              request={{ resource: `project/application/:${appName}`, action: 'update' }}
              project={`${applicationDetail && applicationDetail.project?.name}`}
            >
              <Button onClick={this.editAppPlan} type="secondary">
                <Translation>Edit</Translation>
              </Button>
            </Permission>
          </Col>
        </Row>
        <Row>
          <Col span={24} className="padding16">
            <Card locale={locale().Card} contentHeight="auto">
              <Row wrap={true}>
                <Col m={12} xs={24}>
                  <Item
                    label={<Translation>Name</Translation>}
                    value={applicationDetail && applicationDetail.name}
                  />
                </Col>
                <Col m={12} xs={24}>
                  <Item
                    label={<Translation>Alias</Translation>}
                    value={applicationDetail && applicationDetail.alias}
                  />
                </Col>
              </Row>
              <Row wrap={true}>
                <Col m={12} xs={24}>
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

                <Col m={12} xs={24}>
                  <Item
                    label={<Translation>Description</Translation>}
                    value={applicationDetail && applicationDetail.description}
                  />
                </Col>
              </Row>
              <Row wrap={true}>
                <Col m={12} xs={24}>
                  <Item
                    label={<Translation>Create Time</Translation>}
                    value={momentDate((applicationDetail && applicationDetail.createTime) || '')}
                  />
                </Col>
                <Col m={12} xs={24}>
                  <Item
                    label={<Translation>Update Time</Translation>}
                    value={momentDate((applicationDetail && applicationDetail.updateTime) || '')}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        <Row wrap={true}>
          <Col xl={8} xs={24}>
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
                              resource: `project/application/component:*`,
                              action: 'create',
                            }}
                            project={`${applicationDetail && applicationDetail.project?.name}`}
                          >
                            <a
                              key={'add'}
                              onClick={this.onAddComponent}
                              className="font-size-14 font-weight-400"
                            >
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
          <Col xl={8} xs={24}>
            <Row>
              <Col span={24} className="padding16">
                <Title
                  title={
                    <span className="font-size-16 font-weight-bold">
                      <Translation>Policies</Translation>
                    </span>
                  }
                  actions={[]}
                />
              </Col>
            </Row>
            <PolicyList
              policies={policies}
              envbinding={envbinding}
              onDeletePolicy={(name: string) => {
                console.log(name);
              }}
              onShowPolicy={(name: string) => {
                console.log(name);
              }}
            />
          </Col>
          <Col xl={8} xs={24}>
            <Row>
              <Col span={24} className="padding16">
                <Title
                  actions={[
                    <Permission
                      request={{ resource: `project/application/trigger:*`, action: 'create' }}
                      project={`${(applicationDetail && applicationDetail.project?.name) || ''}`}
                    >
                      <a
                        key={'add'}
                        className="font-size-14 font-weight-400"
                        onClick={this.onAddTrigger}
                      >
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
            componentType={(mainComponent && mainComponent.type) || ''}
            workflows={workflows}
            components={components || []}
            onClose={this.onTriggerClose}
            onOK={(res: Trigger) => {
              this.onTriggerOk(res);
            }}
          />
        </If>

        <If condition={showEditApplication}>
          <EditAppDialog
            editItem={editItem}
            onOK={this.onOkEditAppDialog}
            onClose={this.onCloseEditAppDialog}
          />
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
      </div>
    );
  }
}

export default ApplicationConfig;
