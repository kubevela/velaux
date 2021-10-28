
import React from 'react';
import { Button, Grid, Form, Input, Field, Upload, Icon } from '@b-design/ui';
import { addAppDialog } from '../../constants';
import { addClustDialog, UPLOADYMALFILE } from '../../../../constants';
import NameSpaceForm from '../GeneralConfig/namespace-form';
import DefinitionCode from '../../../../components/DefinitionCode';
import defineTheme from '../../../../components/DefinitionCode/theme';


type Props = {
  visible: boolean;
  namespaceList?: [];
  setVisible: (visible: boolean) => void;
  t: (key: string) => {};
  dispatch: ({ }) => {};
};


class YmalConfig extends React.Component<Props> {
  field: Field;
  DefinitionCodeRef: React.RefObject<DefinitionCode>;
  constructor(props: any) {
    super(props);
    this.field = new Field(this);
    this.DefinitionCodeRef = React.createRef();
  }
  close = () => {
    this.resetField();
  };

  onError = (r: {}) => {
    console.log('onError callback');
  };

  submit = () => {
    console.log('this.dispatch', this.props.dispatch);
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { cluster, describe, name, project, namespace, kubeConfig } = values;
      let namespaceParam = namespace;
      if (Object.prototype.toString.call(namespace) === '[object Array]') {
        namespaceParam = namespace[0];
      }
      const params = {
        clusterList: cluster,
        description: describe,
        icon: '',
        name: name,
        namespace: namespaceParam,
        yamlConfig: kubeConfig
      };
      this.props.dispatch({
        type: 'application/createApplicationList',
        payload: params,
      });
    });

    this.props.setVisible(false);
    this.resetField();
  };

  customRequest = (option: any) => {
    let reader = new FileReader();
    let fileselect = option.file;
    reader.readAsText(fileselect);
    reader.onload = () => {
      console.log(reader.result);
      this.field.setValues({
        kubeConfig: reader.result?.toString() || ''
      })
    };
    return {
      file: File,
      onError: this.onError,
      abort() { },
    };
  };

  resetField() {
    this.field.setValues({
      name: '',
      project: '',
      cluster: [],
      describe: '',
      kubeConfig: '',
    });
  }

  render() {
    const { t, namespaceList = [] } = this.props;
    const {
      name,
      describe,
      namePlaceHold,
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

    const { kubeAPI } = addClustDialog;
    const namePlacehold = t(namePlaceHold).toString();
    const describePlacehold = t(describePlaceHold).toString();
    const init = this.field.init;
    const values: { kubeConfig: string } = this.field.getValues();
    const valueInfo = values.kubeConfig || '';

    return (
      <div>
        <Form {...formItemLayout} field={this.field}>
          <FormItem {...formItemLayout} label={name} labelTextAlign="left" required={true}>
            <Input
              htmlType="name"
              name="name"
              placeholder={namePlacehold}
              {...init('name')}
            />
          </FormItem>

          <NameSpaceForm
            formItemLayout={formItemLayout}
            field={this.field}
            namespaceList={namespaceList}
          />

          <FormItem {...formItemLayout} label={describe} labelTextAlign="left" required={true}>
            <Input
              htmlType="describe"
              name="describe"
              {...init('describe')}
              placeholder={describePlacehold}
            />
          </FormItem>


          <FormItem label={kubeAPI}>
            <Upload request={this.customRequest}>
              <Button text type="normal" className="padding-left-0">
                <Icon type='cloudupload' />{UPLOADYMALFILE}
              </Button>
            </Upload>
            
            <div id="guide-code" className="guide-code">
              <DefinitionCode
                containerId="guide-code"
                language={'yaml'}
                readOnly={false}
                defineTheme={defineTheme}
                {...init('kubeConfig')}
                value={valueInfo}
                ref={this.DefinitionCodeRef}
              />
            </div>

          </FormItem>
        </Form>
      </div>
    );
  }
}

export default YmalConfig;

