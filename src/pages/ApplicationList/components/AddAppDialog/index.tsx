import React from 'react';
import { Grid, Dialog, Field, Form, Select, Message } from '@b-design/ui';
import { withTranslation } from 'react-i18next';
import { NEW_APPLICATION_DELIVERY_PLAN, } from '../../constants';

import { If } from 'tsx-control-statements/components';
import GeneralConfig from '../GeneralConfig';
import Group from '../../../../extends/Group';
import { detailComponentDefinition, createApplicationList } from '../../../../api/application';
import { DefinitionDetail } from '../../../../interface/application';
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
  dispatch: ({ }) => {};
  onClose: () => void;
  onOK: () => void;
};

type State = {
  definitionDetail?: DefinitionDetail;
  definitionLoading: boolean;
  dialogStats: string;
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
    const envBindArray = this.envBind.current?.getValues();
    if (!envBindArray) {
      return;
    }
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
        envBinding: envBindArray,
        component: {
          alias,
          componentType,
          description,
          icon,
          name,
          properties: {}
        }
      };
      this.uiSchemaRef.current?.validate((error: any, values: any) => {
        if (error) {
          return;
        }
        params.component.properties = JSON.stringify(values);
        createApplicationList(params).then((res) => {
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
  }


  changeStatus = (value: string) => {
    const values: { componentType: string } = this.field.getValues()
    const { componentType } = values;

    if (value === 'isCreateComponent') {
      this.field.validate((error: any, values: any) => {
        if (error) {
          return;
        }
        const envBindArray = this.envBind.current?.getValues();
        if (!envBindArray) {
          return;
        }
        this.setState({
          dialogStats: value,
        }, () => {
          this.onDetailsComponeDefinition(componentType);
        });
      });
    } else if (value === 'isBasic') {
      this.setState({
        dialogStats: value
      });
    }
  }

  render() {
    const init = this.field.init;
    const FormItem = Form.Item;
    const { Row, Col } = Grid;
    const formItemLayout = {
      labelCol: { fixedSpan: 4 },
    };

    const { onClose } = this.props;
    const { visible, t, setVisible, dispatch, namespaceList, clusterList = [] } = this.props;

    const { definitionLoading, definitionDetail, dialogStats } = this.state;

    return (
      <DrawerWithFooter
        title={NEW_APPLICATION_DELIVERY_PLAN}
        placement="right"
        width={800}
        dialogStats={dialogStats}
        onClose={onClose}
        changeStatus={(status: string) => { this.changeStatus(status) }}
        onSubmit={this.onSubmit}
      >
        <Form field={this.field}>
          <If condition={dialogStats === 'isBasic'}>
            <Group
              title={<Translation>Apply Basic Information</Translation>}
              description={<Translation>Set the basic properties of the service</Translation>}
              hasToggleIcon
            >
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
            </Group>

            <Row>
              <Col span={24}>
                <FormItem label={<Translation className='font-size-14 font-weight-bold'>Deployment type</Translation>} required={true}>
                  <Select
                    className="select"
                    {...init(`componentType`, {
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
          </If>

          <Row className={dialogStats === 'isBasic' ? '' : 'hiddenEnvbind'}>
            <Col span={24}>
              <FormItem label={<Translation className='font-size-14 font-weight-bold'>Environmental planning</Translation>} required={true}>
                <EnvPlan clusterList={clusterList} ref={this.envBind} />
              </FormItem>
            </Col>
          </Row>

          <If condition={dialogStats === 'isCreateComponent'}>
            <Group
              title="Deployment Parameters"
              description="Automatically generated based on definition"
              loading={definitionLoading}
            >
              <UISchema
                _key="body.properties"
                uiSchema={definitionDetail && definitionDetail.uiSchema}
                ref={this.uiSchemaRef}
              ></UISchema>
            </Group>
          </If>
        </Form>
      </DrawerWithFooter>
    );
  }
}

export default withTranslation()(AppDialog);
