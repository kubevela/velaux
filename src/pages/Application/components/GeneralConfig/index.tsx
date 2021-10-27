import React, { createRef, LegacyRef } from 'react';
import { Button, Message, Grid, Dialog, Form, Input, Select, Field, Radio, Icon } from '@b-design/ui';
import { dataSourceProject, dataSourceCluster, addApp, addAppDialog } from '../../constants';
import EnvPlan from '../../../../components/EnvPlan';
import { stringify } from 'querystring';

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
  description: string
}

type itemObjInfo = {
  name: string;
  clusterSelector: string;
  description: string
}

class GeneralConfig extends React.Component<Props, State> {
  field: any;
  envBind: React.RefObject<EnvPlan>;
  constructor(props: any) {
    super(props);
    this.field = new Field(this);
    this.envBind = React.createRef();
    this.state = {};
  }
  close = () => {
    this.resetField();
  };
  submit = () => {
    const envBindArray: any = [];
    if (this.envBind.current) {
      console.log('envbind', this.envBind.current)
      const { filters } = this.envBind.current.state;
      Object.values(filters).forEach((key) => {
        key.forEach((item: itemObj) => {
          const obj: any = {};
          obj.name = item.name;
          obj.clusterSelector = { name: item.cluster };
          obj.description = item.description;
          envBindArray.push(obj);
        });
      });
    }

    console.log('envBindArrayenvBindArrayh', envBindArray);
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { cluster, describe, name, project, namespace } = values;
      let namespaceParam = namespace;
      if (Object.prototype.toString.call(namespace) === '[object Array]') {
        namespaceParam = namespace[0];
      }
      const params = {
        deploy: true,
        description: describe,
        envBind: envBindArray,
        icon: '',
        name: name,
        namespace: namespaceParam,

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
      project: '',
      cluster: [],
      describe: '',
    });
  }
  handleSelectNameSpace = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('chose', e);
  };
  handleSelectProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('chose', e);
  };

  handleSelectCluster = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('chose', e);
  };

  getNameSpace() {
    const FormItem = Form.Item;
    const formItemLayout = {
      labelCol: {
        fixedSpan: 6,
      },
      wrapperCol: {
        span: 20,
      },
    };
    const { visible, t, namespaceList } = this.props;
    const init = this.field.init;
    const enterPlaceHold = t('Please enter').toString();
    const chosePlaceHold = t('Please chose').toString();
    console.log('namespaceListnamespaceList', namespaceList);
    if (namespaceList && namespaceList.length != 0) {
      return (
        <FormItem {...formItemLayout} label={'namespace'} labelTextAlign="left" required={true}>
          <Select
            mode="single"
            onChange={this.handleSelectNameSpace}
            dataSource={namespaceList}
            {...init('namespace')}
            placeholder={chosePlaceHold}
          />
        </FormItem>
      );
    } else {
      return (
        <FormItem {...formItemLayout} label={'namespace'} labelTextAlign="left" required={true}>
          <Input
            htmlType="namespace"
            name="namespace"
            placeholder={enterPlaceHold}
            {...init('namespace')}
          />
        </FormItem>
      );
    }
  }


  render() {
    const { Row, Col } = Grid;
    const { visible, t, clusterList } = this.props;
    const {
      name,
      describe,
      namePlaceHold,
      clustPlaceHold,
      describePlaceHold,
    } = addAppDialog;
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
    const clustPlacehold = t(clustPlaceHold).toString();
    const describePlacehold = t(describePlaceHold).toString();
    const init = this.field.init;
    const namespaceForm = this.getNameSpace();
    return (
      <div>
        <Form {...formItemLayout} field={this.field}>
          <FormItem {...formItemLayout} label={name} labelTextAlign="left" required={true}>
            <Input htmlType="name" name="name" placeholder={namePlacehold} {...init('name')} />
          </FormItem>
          {namespaceForm}

          <FormItem {...formItemLayout} label={'环境规划'} labelTextAlign="left" required={true}>
            <EnvPlan
              clusterList={clusterList}
              ref={this.envBind}
            />
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
