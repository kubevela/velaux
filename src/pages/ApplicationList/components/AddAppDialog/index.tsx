import React from 'react';
import { Grid, Field, Form, Select, Message, Button } from '@b-design/ui';
import { withTranslation } from 'react-i18next';
import { Link } from 'dva/router';
import { If } from 'tsx-control-statements/components';
import GeneralConfig from '../GeneralConfig';
import type { Rule } from '@alifd/field';
import { detailComponentDefinition, createApplication } from '../../../../api/application';
import type { DefinitionDetail, EnvBinding } from '../../../../interface/application';
import UISchema from '../../../../components/UISchema';
import DrawerWithFooter from '../../../../components/Drawer';
import EnvPlan from '../../../../components/EnvPlan';
import Translation from '../../../../components/Translation';
import './index.less';
import { getDeliveryTarget } from '../../../../api/deliveryTarget';
import type { DeliveryTarget } from '../../../../interface/deliveryTarget';
import type { Project } from '../../../../interface/project';
import type { Cluster } from '../../../../interface/cluster';
import { connect } from 'dva';

type Props = {
  visible: boolean;
  componentDefinitions: [];
  projects?: Project[];
  clusterList?: Cluster[];
  setVisible: (visible: boolean) => void;
  t: (key: string) => string;
  dispatch: ({}) => void;
  onClose: () => void;
  onOK: (name: string) => void;
};

type State = {
  definitionDetail?: DefinitionDetail;
  definitionLoading: boolean;
  dialogStats: string;
  envBinding: EnvBinding[];
  deliveryTargets?: DeliveryTarget[];
  project?: string;
};

@connect((store: any) => {
  return { ...store.clusters };
})
class AppDialog extends React.Component<Props, State> {
  field: Field;
  basicRef: React.RefObject<GeneralConfig>;
  envBind: React.RefObject<any>;
  uiSchemaRef: React.RefObject<UISchema>;
  constructor(props: Props) {
    super(props);
    this.state = {
      definitionLoading: true,
      dialogStats: 'isBasic',
      envBinding: [],
    };
    this.field = new Field(this, {
      onChange: (name: string, value: string) => {
        if (name === 'namespace') {
          this.setState({ project: value }, () => {
            this.loadDeliveryTarget();
          });
        }
      },
    });
    this.uiSchemaRef = React.createRef();
    this.basicRef = React.createRef();
    this.envBind = React.createRef();
  }

  componentDidMount() {
    const { projects } = this.props;
    if (projects && projects.length > 0) {
      this.field.setValue('namespace', projects[0].name);
      this.setState({ project: projects[0].name }, () => {
        this.loadDeliveryTarget();
      });
    }
    this.getClusterList();
  }

  onClose = () => {
    this.props.setVisible(false);
  };

  getClusterList = async () => {
    this.props.dispatch({
      type: 'clusters/getClusterList',
    });
  };

  onSubmit = () => {
    const { envBinding } = this.state;
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { description, alias, name, namespace, icon = '', componentType, properties } = values;
      const params = {
        alias,
        icon,
        name,
        description,
        namespace,
        envBinding: envBinding,
        component: {
          alias,
          componentType,
          description,
          icon,
          name,
          properties: JSON.stringify(properties),
        },
      };
      createApplication(params).then((res) => {
        if (res) {
          Message.success(<Translation>create application success</Translation>);
          this.props.onOK(name);
        }
      });
    });
  };

  loadDeliveryTarget = () => {
    if (this.state.project) {
      getDeliveryTarget({ namespace: this.state.project, page: 0 }).then((res) => {
        if (res) {
          this.setState({ deliveryTargets: res.deliveryTargets });
        }
      });
    }
  };

  transComponentDefinitions() {
    const { componentDefinitions } = this.props;
    return (componentDefinitions || []).map((item: { name: string }) => ({
      lable: item.name,
      value: item.name,
    }));
  }

  onDetailsComponeDefinition = (value: string) => {
    detailComponentDefinition({ name: value }).then((re) => {
      if (re) {
        this.setState({ definitionDetail: re, definitionLoading: false });
      }
    });
  };

  changeStatus = (value: string) => {
    const values: { componentType: string } = this.field.getValues();
    const { componentType } = values;
    if (value === 'isCreateComponent') {
      this.field.validateCallback(
        ['name', 'alias', 'description', 'namespace', 'componentType'],
        (error: any) => {
          if (error) {
            return;
          }
          const envBinding = this.envBind.current?.getValues();
          if (!envBinding || envBinding.length < 1) {
            return;
          }
          this.setState(
            {
              envBinding: envBinding,
              dialogStats: value,
            },
            () => {
              this.onDetailsComponeDefinition(componentType);
            },
          );
        },
      );
    } else if (value === 'isBasic') {
      this.setState({
        dialogStats: value,
      });
    }
  };

  extButtonList = () => {
    const { dialogStats } = this.state;
    const { onClose } = this.props;
    if (dialogStats === 'isBasic') {
      return (
        <div>
          <Button type="secondary" onClick={onClose} className="margin-right-10">
            <Translation>Cancel</Translation>
          </Button>
          <Button
            type="primary"
            onClick={() => {
              this.changeStatus('isCreateComponent');
            }}
          >
            <Translation>Next Step</Translation>
          </Button>
        </div>
      );
    } else if (dialogStats === 'isCreateComponent') {
      return (
        <div>
          <Button
            type="secondary"
            onClick={() => {
              this.changeStatus('isBasic');
            }}
            className="margin-right-10"
          >
            <Translation>Previous</Translation>
          </Button>
          <Button type="primary" onClick={this.onSubmit}>
            <Translation>Create</Translation>
          </Button>
        </div>
      );
    } else {
      return <div />;
    }
  };

  render() {
    const init = this.field.init;
    const FormItem = Form.Item;
    const { Row, Col } = Grid;

    const { onClose } = this.props;
    const { visible, t, setVisible, dispatch, projects, clusterList } = this.props;

    const { envBinding, definitionDetail, dialogStats, deliveryTargets } = this.state;
    const validator = (rule: Rule, value: any, callback: (error?: string) => void) => {
      this.uiSchemaRef.current?.validate(callback);
    };
    return (
      <DrawerWithFooter
        title={<Translation>New Application</Translation>}
        placement="right"
        width={800}
        onClose={onClose}
        extButtons={this.extButtonList()}
      >
        <Form field={this.field}>
          <If condition={dialogStats === 'isBasic'}>
            <GeneralConfig
              t={t}
              visible={visible}
              setVisible={setVisible}
              dispatch={dispatch}
              projects={projects}
              field={this.field}
              ref={this.basicRef}
            />

            <Row>
              <Col span={24} style={{ padding: '0 8px' }}>
                <FormItem
                  label={
                    <Translation className="font-size-14 font-weight-bold">
                      Deployment Type
                    </Translation>
                  }
                  required={true}
                  help={
                    <span>
                      Get more deployment type? <Link to="/addons">Go to enable addon</Link>
                    </span>
                  }
                >
                  <Select
                    className="select"
                    {...init(`componentType`, {
                      initValue: 'webservice',
                      rules: [
                        {
                          required: true,
                          message: 'Please select',
                        },
                      ],
                    })}
                    dataSource={this.transComponentDefinitions()}
                  />
                </FormItem>
              </Col>
            </Row>
            <Row>
              <Col span={24} style={{ padding: '0 8px' }}>
                <FormItem
                  label={
                    <Translation className="font-size-14 font-weight-bold">
                      Environment Plan
                    </Translation>
                  }
                  required={true}
                >
                  <EnvPlan
                    t={this.props.t}
                    value={envBinding}
                    projects={projects || []}
                    clusterList={clusterList || []}
                    onUpdateTarget={this.loadDeliveryTarget}
                    targetList={deliveryTargets}
                    project={this.state.project}
                    ref={this.envBind}
                  />
                </FormItem>
              </Col>
            </Row>
          </If>

          <If condition={dialogStats === 'isCreateComponent'}>
            <FormItem required={true}>
              <UISchema
                {...init(`properties`, {
                  rules: [
                    {
                      validator: validator,
                      message: 'Please check app deploy properties',
                    },
                  ],
                })}
                uiSchema={definitionDetail && definitionDetail.uiSchema}
                ref={this.uiSchemaRef}
              />
            </FormItem>
          </If>
        </Form>
      </DrawerWithFooter>
    );
  }
}

export default withTranslation()(AppDialog);
