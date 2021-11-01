import React from 'react';
import { Grid, Form, Input, Select, Field } from '@b-design/ui';
import NameSpaceForm from './namespace-form';
import EnvPlan from '../../../../components/EnvPlan';
import { addAppDialog } from '../../constants';
import './index.less';

type Props = {
  visible: boolean;
  namespaceList?: [];
  clusterList?: [];
  setVisible: (visible: boolean) => void;
  t: (key: string) => {};
  dispatch: ({ }) => {};
};

type State = {};

type itemObj = {
  name: string;
  cluster: string;
  description?: string;
};

class GeneralConfig extends React.Component<Props, State> {
  field: Field;
  envBind: React.RefObject<EnvPlan>;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.envBind = React.createRef();
  }

  close = () => {
    this.resetField();
  };

  submit = () => {
    const envBindArray: any = [];
    if (this.envBind.current) {
      const { envs } = this.envBind.current.state;
      Object.values(envs).forEach((key) => {
        key.forEach((item: itemObj) => {
          const obj: any = {};
          obj.name = item.name;
          obj.clusterSelector = { name: item.cluster };
          obj.description = item.description;
          envBindArray.push(obj);
        });
      });
    }
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { deploy = true, describe, name, project, namespace, icon = '' } = values;
      let namespaceParam = namespace;
      if (Object.prototype.toString.call(namespace) === '[object Array]') {
        namespaceParam = namespace[0];
      }
      const params = {
        icon,
        name,
        namespace: namespaceParam,
        deploy: true,
        description: describe,
        envBind: envBindArray,
      };
      this.props.dispatch({
        type: 'application/createApplicationList',
        payload: params,
      });
    });

    this.props.setVisible(false);
    this.resetField();
  };

  resetField() {
    this.field.setValues({
      name: '',
      cluster: [],
      describe: '',
    });
  }

  render() {
    const { Row, Col } = Grid;
    const { t, namespaceList = [], clusterList = [] } = this.props;
    const { name, describe, namePlaceHold, describePlaceHold, ENVPLACEHOLD } = addAppDialog;
    const FormItem = Form.Item;
    const formItemLayout = {
      labelCol: {
        fixedSpan: 6,
      },
      wrapperCol: {
        span: 20,
      },
    };

    const namePlacehold = t(namePlaceHold).toString();
    const describePlacehold = t(describePlaceHold).toString();
    const init = this.field.init;

    return (
      <div>
        <Form {...formItemLayout} field={this.field}>
          <FormItem {...formItemLayout} label={name} labelTextAlign="left" required={true}>
            <Input
              htmlType="name"
              name="name"
              maxLength={32}
              placeholder={namePlacehold}
              {...init('name')}
            />
          </FormItem>

          <NameSpaceForm
            formItemLayout={formItemLayout}
            field={this.field}
            namespaceList={namespaceList}
          />

          <FormItem {...formItemLayout} label={ENVPLACEHOLD} labelTextAlign="left" required={true}>
            <EnvPlan clusterList={clusterList} ref={this.envBind} />
          </FormItem>

          <FormItem {...formItemLayout} label={describe} labelTextAlign="left" required={true}>
            <Input
              htmlType="describe"
              name="describe"
              {...init('describe')}
              placeholder={describePlacehold}
            />
          </FormItem>
        </Form>
      </div>
    );
  }
}

export default GeneralConfig;
