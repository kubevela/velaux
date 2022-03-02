import React, { Component } from 'react';
import { Grid, Button, Card, Message } from '@b-design/ui';
import './index.less';
import { connect } from 'dva';
import { If } from 'tsx-control-statements/components';
import {
  getTraitDefinitions,
  getAppliationComponent,
  deleteTrait,
  getAppliationTriggers,
  deleteTriggers,
} from '../../api/application';
import Translation from '../../components/Translation';
import Title from '../../components/Title';
import Item from '../../components/Item';
import TraitDialog from './components/TraitDialog';
import TraitsList from './components/TraitsList';
import type {
  ApplicationDetail,
  Trait,
  ApplicationComponent,
  EnvBinding,
  Trigger,
  Workflow,
} from '../../interface/application';
import { momentDate } from '../../utils/common';
import EditProperties from './components/EditProperties';
import locale from '../../utils/locale';
import TriggerList from './components/TriggerList';
import TriggerDialog from './components/TriggerDialog';
import i18n from '../../i18n';

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
  components?: ApplicationComponent[];
  componentsApp?: string;
  envbinding?: EnvBinding[];
  workflows?: Workflow[];
};

type State = {
  appName: string;
  componentName: string;
  visibleTrait: boolean;
  isEditTrait: boolean;
  traitDefinitions: [];
  mainComponent?: ApplicationComponent;
  traitItem: Trait;
  visibleEditComponentProperties: boolean;
  triggers: Trigger[];
  visibleTrigger: boolean;
  createTriggerInfo: Trigger;
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
      traitDefinitions: [],
      traitItem: { type: '' },
      visibleEditComponentProperties: false,
      triggers: [],
      visibleTrigger: false,
      createTriggerInfo: { name: '', workflowName: '', type: 'webhook', token: '' },
    };
  }

  componentDidMount() {
    this.onGetTraitdefinitions();
    const { components, componentsApp } = this.props;
    const { appName } = this.state;
    if (components && components.length > 0 && componentsApp == appName) {
      const componentName = components[0].name || '';
      this.setState({ componentName }, () => {
        this.onGetAppliationComponent();
      });
    }
    this.onGetAppliationTrigger();
  }

  componentWillReceiveProps(nextProps: any) {
    if (nextProps.components !== this.props.components) {
      const componentName =
        (nextProps.components && nextProps.components[0] && nextProps.components[0].name) || '';
      this.setState({ componentName }, () => {
        this.onGetAppliationComponent();
      });
    }
  }

  onGetAppliationComponent() {
    const { appName, componentName } = this.state;
    const params = {
      appName,
      componentName,
    };
    getAppliationComponent(params).then((res: any) => {
      if (res) {
        this.setState({
          mainComponent: res,
        });
      }
    });
  }

  onGetAppliationTrigger() {
    const { appName } = this.state;
    const params = {
      appName,
    };
    getAppliationTriggers(params).then((res: any) => {
      if (res) {
        this.setState({
          triggers: res.triggers || [],
        });
      }
    });
  }

  onGetTraitdefinitions = async () => {
    getTraitDefinitions().then((res: any) => {
      if (res) {
        this.setState({
          traitDefinitions: res && res.definitions,
        });
      }
    });
  };

  onDeleteTrait = async (traitType: string) => {
    const { appName, componentName } = this.state;
    const params = {
      appName,
      componentName,
      traitType,
    };
    deleteTrait(params).then((res: any) => {
      if (res) {
        this.onGetAppliationComponent();
      }
    });
  };

  onClose = () => {
    this.setState({ visibleTrait: false, isEditTrait: false });
  };

  onOk = () => {
    this.onGetAppliationComponent();
    this.setState({
      isEditTrait: false,
      visibleTrait: false,
    });
  };

  onAddTrait = () => {
    this.setState({
      visibleTrait: true,
      traitItem: { type: '' },
      isEditTrait: false,
    });
  };
  onEditParamter = () => {
    this.setState({ visibleEditComponentProperties: true });
  };
  changeTraitStats = (isEditTrait: boolean, traitItem: Trait) => {
    this.setState({
      visibleTrait: true,
      isEditTrait,
      traitItem,
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
  };

  onTriggerOk = (res: Trigger) => {
    this.onGetAppliationTrigger();
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
        this.onGetAppliationTrigger();
      }
    });
  };

  render() {
    const { applicationDetail, dispatch, envbinding, workflows } = this.props;
    const {
      visibleTrait,
      isEditTrait,
      traitDefinitions,
      appName = '',
      componentName = '',
      mainComponent,
      traitItem,
      visibleEditComponentProperties,
      triggers,
      visibleTrigger,
      createTriggerInfo,
    } = this.state;
    return (
      <div>
        <Row>
          <Col span={12} className="padding16">
            <Message
              type="notice"
              title={i18n.t(
                'Note that baseline configuration changes will be applied to all environments',
              )}
            />
          </Col>
          <Col span={12} className="padding16 flexright">
            <Button onClick={this.onEditParamter} type="secondary">
              <Translation>Edit Properties</Translation>
            </Button>
          </Col>
        </Row>
        <Row>
          <Col span={24} className="padding16">
            <Card locale={locale.Card} contentHeight="auto">
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
              <Row wrap={true}>
                <Col span={24}>
                  <Item
                    label={<Translation>Description</Translation>}
                    labelSpan={4}
                    value={applicationDetail && applicationDetail.description}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        <If condition={applicationDetail?.applicationType == 'common'}>
          <Row>
            <Col span={24} className="padding16">
              <Title
                actions={[
                  <a key={'add'} onClick={this.onAddTrait}>
                    <Translation>New Trait</Translation>
                  </a>,
                ]}
                title={<Translation>Traits</Translation>}
              />
            </Col>
          </Row>
          <TraitsList
            traits={mainComponent?.traits || []}
            changeTraitStats={(is: boolean, trait: Trait) => {
              this.changeTraitStats(is, trait);
            }}
            onDeleteTrait={(traitType: string) => {
              this.onDeleteTrait(traitType);
            }}
            onAdd={this.onAddTrait}
          />
          <If condition={triggers.length > 0}>
            <Row>
              <Col span={24} className="padding16">
                <Title
                  actions={[
                    <a key={'add'} onClick={this.onAddTrigger}>
                      <Translation>New Trigger</Translation>
                    </a>,
                  ]}
                  title={<Translation>Triggers</Translation>}
                />
              </Col>
            </Row>
            <TriggerList
              triggers={triggers}
              component={mainComponent}
              onDeleteTrigger={(token: string) => {
                this.onDeleteTrigger(token);
              }}
              createTriggerInfo={createTriggerInfo}
            />
          </If>
        </If>

        <If condition={visibleTrait}>
          <TraitDialog
            visible={visibleTrait}
            appName={appName}
            componentName={componentName}
            isEditTrait={isEditTrait}
            traitItem={traitItem}
            traitDefinitions={traitDefinitions}
            onClose={this.onClose}
            onOK={this.onOk}
          />
        </If>

        <If condition={visibleEditComponentProperties && mainComponent}>
          <EditProperties
            onOK={() => {
              this.onGetAppliationComponent();
              this.setState({ visibleEditComponentProperties: false });
            }}
            onClose={() => {
              this.setState({ visibleEditComponentProperties: false });
            }}
            applicationDetail={applicationDetail}
            defaultEnv={
              Array.isArray(envbinding) && envbinding.length > 0 ? envbinding[0] : undefined
            }
            component={mainComponent}
            dispatch={dispatch}
          />
        </If>

        <If condition={visibleTrigger}>
          <TriggerDialog
            visible={visibleTrigger}
            appName={appName}
            componentType={(mainComponent && mainComponent.type) || ''}
            workflows={workflows}
            onClose={this.onTriggerClose}
            onOK={(res: Trigger) => {
              this.onTriggerOk(res);
            }}
          />
        </If>
      </div>
    );
  }
}

export default ApplicationConfig;
