import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import { Dialog, Field, Form, Grid, Input, Message, Select } from '@b-design/ui';
import { AppPlanDetail } from '../../../../interface/applicationplan';
import { createApplicationEnv } from '../../../../api/application';
import NameSpaceForm from '../../../ApplicationPlanList/components/GeneralConfig/namespace-form';
import Translation from '../../../../components/Translation';
import EnvPlan from '../../../../extends/EnvPlan';
import AddDepolySercice from '../AddDepolyService';
import { checkName } from '../../../../utils/common';
import { any, string } from 'prop-types';

type Props = {
  appPlanBase: AppPlanDetail;
  activeKey: string;
  allComponents: [];
  clusterList: [];
  namespaceList: [];
  onClose: () => void;
  onOK: () => void;
  t: (key: string) => {};
  dispatch: ({}) => {};
};

type State = {
  componentSelectorComponents: any;
};

class EditEnvBindDialog extends Component<Props, State> {
  field: Field;
  envBind: React.RefObject<EnvPlan>;
  serviceBind: React.RefObject<AddDepolySercice>;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.envBind = React.createRef();
    this.serviceBind = React.createRef();
    this.state = {
      componentSelectorComponents: [],
    };
  }

  componentDidMount() {
    this.getInitValue();
  }

  getInitValue() {
    const { activeKey, appPlanBase } = this.props;
    const { envBind = [] } = appPlanBase;
    const findItem = envBind.find((item) => item.name === activeKey);
    if (findItem) {
      const {
        name,
        alias,
        clusterSelector = { name: string, namespace: string },
        description,
        componentSelector = { components: [] },
      } = findItem;
      this.field.setValues({
        name,
        alias,
        clusterSelectorName: clusterSelector.name,
        namespace: clusterSelector.namespace,
        description,
      });
      this.setState({
        componentSelectorComponents: (componentSelector && componentSelector.components) || [],
      });
    }
  }

  onSubmit = () => {
    const { appPlanBase } = this.props;
    const serviceRef: any = this.serviceBind?.current;
    const componentServices = serviceRef.state && serviceRef.state.componentServices;
    const componets: string[] = [];
    (componentServices || []).forEach((item: { checked: boolean; name: string }) => {
      if (item.checked === true) {
        componets.push(item.name);
      }
    });

    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { name, alias, clusterSelectorName, namespace, description } = values;
      const params = {
        appName: appPlanBase.name,
        name,
        alias,
        clusterSelector: {
          name: clusterSelectorName,
          namespace,
        },
        componentSelector: {
          components: componets,
        },
        description,
      };
      this.onCreateApplicationEnv(params);
    });
  };

  onCreateApplicationEnv(params: any) {
    createApplicationEnv(params).then((res) => {
      if (res) {
        const { appPlanBase } = this.props;
        Message.success(<Translation>Create Service Environment Success</Translation>);
        this.props.onClose();
        this.props.dispatch({
          type: 'application/getApplicationPlanDetail',
          payload: { appPlanName: appPlanBase.name },
        });
      }
    });
  }
  render() {
    const { t, allComponents, clusterList = [], namespaceList, activeKey } = this.props;
    const { componentSelectorComponents } = this.state;
    const { Row, Col } = Grid;
    const FormItem = Form.Item;
    const init = this.field.init;
    const formItemLayout = {
      labelCol: {
        fixedSpan: 6,
      },
      wrapperCol: {
        span: 20,
      },
    };

    const clusterListDataSource = (clusterList || []).map((item: { name: string }) => ({
      label: item.name,
      value: item.name,
    }));

    return (
      <Dialog
        visible={true}
        style={{ width: '1000px' }}
        footerActions={['ok']}
        onClose={this.props.onClose}
        onOk={this.onSubmit}
        title={<Translation>Edit Environment</Translation>}
      >
        <Form {...formItemLayout} field={this.field}>
          <Row>
            <Col span={12} style={{ padding: '0 8px' }}>
              <FormItem label={<Translation>Environment name</Translation>} required={true}>
                <Input
                  htmlType="name"
                  name="name"
                  maxLength={32}
                  placeholder={t('Environment Name placehold').toString()}
                  disabled
                  {...init('name', {
                    rules: [
                      {
                        required: true,
                        pattern: checkName,
                        message: 'Please enter a valid env name',
                      },
                    ],
                  })}
                />
              </FormItem>
            </Col>

            <Col span={12} style={{ padding: '0 8px' }}>
              <FormItem label={<Translation>Environment alias</Translation>}>
                <Input
                  name="alias"
                  placeholder={'Give your app a more recognizable name'}
                  {...init('alias', {
                    rules: [
                      {
                        minLength: 2,
                        maxLength: 64,
                        message: 'Enter a string of 2 to 64 characters.',
                      },
                    ],
                  })}
                />
              </FormItem>
            </Col>
          </Row>

          <Row>
            <Col span={12} style={{ padding: '0 8px' }}>
              <Form.Item label={<Translation>Cluster Screening</Translation>} required={true}>
                <Select
                  className="select"
                  disabled
                  {...init('clusterSelectorName', {
                    rules: [
                      {
                        required: true,
                        message: 'Chose a Cluster',
                      },
                    ],
                  })}
                  dataSource={clusterListDataSource}
                />
              </Form.Item>
            </Col>
            <Col span={12} style={{ padding: '0 8px' }}>
              <NameSpaceForm field={this.field} namespaceList={namespaceList} disabled={true} />
            </Col>
          </Row>

          <Row>
            <Col span={12} style={{ padding: '0 8px' }}>
              <FormItem label={<Translation>Environmental notes</Translation>}>
                <Input
                  name="description"
                  placeholder={t('Enter description').toString()}
                  {...init('description', {
                    rules: [
                      {
                        maxLength: 128,
                        message: 'Enter a description less than 128 characters.',
                      },
                    ],
                  })}
                />
              </FormItem>
            </Col>
          </Row>

          <Row>
            <Col span={24} style={{ padding: '0 8px' }}>
              <FormItem label={''} required={true}>
                <AddDepolySercice
                  isEdit={true}
                  componentSelectorComponents={componentSelectorComponents}
                  allComponents={allComponents}
                  ref={this.serviceBind}
                />
              </FormItem>
            </Col>
          </Row>
        </Form>
      </Dialog>
    );
  }
}

export default withTranslation()(EditEnvBindDialog);
