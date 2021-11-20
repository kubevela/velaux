import React, { Component } from 'react';
import { Grid, Button, Card, Message, Progress } from '@b-design/ui';
import './index.less';
import { connect } from 'dva';
import { If } from 'tsx-control-statements/components';
import { getTraitDefinitions, getAppliationComponent, deleteTrait } from '../../api/application';
import Translation from '../../components/Translation';
import Title from '../../components/Title';
import Item from '../../components/Item';
import TraitDialog from './components/TraitDialog';
import TraitsList from './components/TraitsList';
import { ApplicationDetail, Trait, ApplicationComponent } from '../../interface/application';
import { momentDate } from '../../utils/common';

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
  components?: [];
};

type State = {
  appName: string;
  componentName: string;
  visibleTrait: boolean;
  isEditTrait: boolean;
  traitDefinitions: [];
  configDetail: ApplicationComponent;
  traitItem: Trait;
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
      configDetail: {},
      traitItem: { type: '' },
    };
  }

  componentDidMount() {
    this.onGetTraitdefinitions();
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
          configDetail: res,
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

  changeTraitStats = (isEditTrait: boolean, traitItem: Trait) => {
    this.setState({
      visibleTrait: true,
      isEditTrait,
      traitItem,
    });
  };

  render() {
    const { applicationDetail, components } = this.props;
    const {
      visibleTrait,
      isEditTrait,
      traitDefinitions,
      appName = '',
      componentName = '',
      configDetail = {},
      traitItem,
    } = this.state;
    return (
      <div>
        <Row>
          <Col span={12} className="padding16">
            <Message
              type="notice"
              title="Note that benchmark configuration changes will be applied to all environments"
            ></Message>
          </Col>
          <Col span={12} className="padding16 flexright">
            <Button type="secondary">
              <Translation>Edit Parameter</Translation>
            </Button>
          </Col>
        </Row>
        <Row>
          <Col span={12} className="padding16">
            <Card>
              <Row>
                <Col span={12}>
                  <Item label="alias" value={applicationDetail && applicationDetail.alias}></Item>
                </Col>
                <Col span={12}>
                  <Item
                    label="project"
                    value={applicationDetail && applicationDetail.namespace}
                  ></Item>
                </Col>
              </Row>
              <Row>
                <Col span={12}>
                  <Item
                    label="createTime"
                    value={momentDate((applicationDetail && applicationDetail.createTime) || '')}
                  ></Item>
                </Col>
                <Col span={12}>
                  <Item
                    label="updateTime"
                    value={momentDate((applicationDetail && applicationDetail.updateTime) || '')}
                  ></Item>
                </Col>
              </Row>
              <Row>
                <Col span={24}>
                  <Item
                    label="description"
                    labelSpan={4}
                    value={applicationDetail && applicationDetail.description}
                  ></Item>
                </Col>
              </Row>
            </Card>
          </Col>
          <Col span={12} className="padding16">
            <Card></Card>
          </Col>
        </Row>

        <Row>
          <Col span={24} className="padding16">
            <Title
              actions={[
                <a onClick={this.onAddTrait}>
                  <Translation>Add Trait</Translation>
                </a>,
              ]}
              title={<Translation>Traits</Translation>}
            ></Title>
          </Col>
        </Row>

        <TraitsList
          traits={configDetail.traits || []}
          changeTraitStats={(isEditTrait: boolean, traitItem: Trait) => {
            this.changeTraitStats(isEditTrait, traitItem);
          }}
          onDeleteTrait={(traitType: string) => {
            this.onDeleteTrait(traitType);
          }}
          onAdd={this.onAddTrait}
        />

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
      </div>
    );
  }
}

export default ApplicationConfig;
