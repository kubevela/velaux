import React from 'react';
import { Grid, Dialog, Field, Form, Select, Message, Button } from '@b-design/ui';
import { withTranslation } from 'react-i18next';
import { NEW_APPLICATION_DELIVERY_PLAN } from '../../constants';

import { If } from 'tsx-control-statements/components';
import GeneralConfig from '../GeneralConfig';
import Group from '../../../../extends/Group';
import { detailComponentDefinition, createApplication } from '../../../../api/application';
import { DefinitionDetail, EnvBinding } from '../../../../interface/application';
import UISchema from '../../../../components/UISchema';
import DrawerWithFooter from '../../../../components/Drawer';
import EnvPlan from '../../../../extends/EnvPlan';
import Translation from '../../../../components/Translation';
import './index.less';

type Props = {
  visible: boolean;
  componentDefinitions: [];
  namespaceList?: [];
  clusterList?: [];
  setVisible: (visible: boolean) => void;
  t: (key: string) => {};
  dispatch: ({}) => {};
  onClose: () => void;
  onOK: () => void;
};

type State = {
  definitionDetail?: DefinitionDetail;
  definitionLoading: boolean;
  dialogStats: string;
  envBinding: Array<EnvBinding>;
};

class AppDialog extends React.Component<Props, State> {
  field: Field;
  basicRef: React.RefObject<GeneralConfig>;
  envBind: React.RefObject<EnvPlan>;
  uiSchemaRef: React.RefObject<UISchema>;
  constructor(props: Props) {
    super(props);
    this.state = {
      definitionLoading: true,
      dialogStats: 'isBasic',
      envBinding: [],
    };
    this.field = new Field(this);
    this.uiSchemaRef = React.createRef();
    this.basicRef = React.createRef();
    this.envBind = React.createRef();
  }

  onClose = () => {
    this.props.setVisible(false);
  };

  onSubmit = () => {
    const { envBinding } = this.state;
    debugger;
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { description, alias, name, namespace, icon = '', componentType } = values;
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
          properties: '',
        },
      };
      this.uiSchemaRef.current?.validate((error: any, values: any) => {
        if (error) {
          return;
        }
        params.component.properties = JSON.stringify(values);
        createApplication(params).then((res) => {
          if (res) {
            Message.success(<Translation>create application success</Translation>);
            this.props.onOK();
          }
        });
      });
    });
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
      this.field.validate((error: any, values: any) => {
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
      });
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
            <Translation>Cancle</Translation>
          </Button>
          <Button
            type="primary"
            onClick={() => {
              this.changeStatus('isCreateComponent');
            }}
          >
            <Translation>NextStep</Translation>
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
      return <div></div>;
    }
  };

  render() {
    const init = this.field.init;
    const FormItem = Form.Item;
    const { Row, Col } = Grid;

    const { onClose } = this.props;
    const { visible, t, setVisible, dispatch, namespaceList, clusterList = [] } = this.props;

    const { envBinding, definitionDetail, dialogStats } = this.state;

    return (
      <DrawerWithFooter
        title={NEW_APPLICATION_DELIVERY_PLAN}
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
              namespaceList={namespaceList}
              clusterList={clusterList}
              field={this.field}
              ref={this.basicRef}
            />

            <Row>
              <Col span={24} style={{ padding: '0 8px' }}>
                <FormItem
                  label={
                    <Translation className="font-size-14 font-weight-bold">
                      Deployment type
                    </Translation>
                  }
                  required={true}
                >
                  <Select
                    className="select"
                    {...init(`componentType`, {
                      initValue: 'webservice',
                      rules: [
                        {
                          required: true,
                          message: 'Please chose',
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
                      Environmental planning
                    </Translation>
                  }
                  required={true}
                >
                  <EnvPlan
                    value={envBinding}
                    targetList={[{ name: 'default', alias: 'default' }]}
                    ref={this.envBind}
                  />
                </FormItem>
              </Col>
            </Row>
          </If>

          <If condition={dialogStats === 'isCreateComponent'}>
            <UISchema
              _key="body.properties"
              uiSchema={definitionDetail && definitionDetail.uiSchema}
              ref={this.uiSchemaRef}
            ></UISchema>
          </If>
        </Form>
      </DrawerWithFooter>
    );
  }
}

export default withTranslation()(AppDialog);
