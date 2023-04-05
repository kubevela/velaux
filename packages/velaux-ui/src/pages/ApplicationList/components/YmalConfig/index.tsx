import { Button, Grid, Form, Input, Field, Upload, Message } from '@alifd/next';
import React from 'react';
import { AiOutlineCloudUpload } from 'react-icons/ai';

import DefinitionCode from '../../../../components/DefinitionCode';
import { Translation } from '../../../../components/Translation';
import i18n from '../../../../i18n';
import { checkName } from '../../../../utils/common';
import NameSpaceForm from '../GeneralConfig/project-form';
const { Row, Col } = Grid;

type Props = {
  visible: boolean;
  namespaceList?: [];
  setVisible: (visible: boolean) => void;
  t: (key: string) => {};
  dispatch: ({}) => {};
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

  onError = () => {};

  submit = () => {
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { description, name, alias, namespace, kubeConfig } = values;
      const params = {
        description: description,
        alias: alias,
        icon: '',
        name: name,
        namespace: namespace,
        yamlConfig: kubeConfig,
      };
      this.props.dispatch({
        type: 'application/createApplicationPlan',
        payload: params,
        callback: () => {
          Message.success('application add success');
          this.props.setVisible(false);
          this.resetField();
        },
      });
    });
  };

  customRequest = (option: any) => {
    const reader = new FileReader();
    const fileselect = option.file;
    reader.readAsText(fileselect);
    reader.onload = () => {
      this.field.setValues({
        kubeConfig: reader.result?.toString() || '',
      });
    };
    return {
      file: File,
      onError: this.onError,
      abort() {},
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
    const { namespaceList = [] } = this.props;
    const FormItem = Form.Item;
    const formItemLayout = {
      labelCol: {
        fixedSpan: 6,
      },
      wrapperCol: {
        span: 20,
      },
    };
    const init = this.field.init;
    const values: { kubeConfig: string } = this.field.getValues();
    const valueInfo = values.kubeConfig || '';

    return (
      <div>
        <Form {...formItemLayout} field={this.field}>
          <Row>
            <Col span={12} style={{ padding: '0 8px' }}>
              <FormItem label={<Translation>Name</Translation>} labelTextAlign="left" required={true}>
                <Input
                  htmlType="name"
                  name="name"
                  maxLength={32}
                  {...init('name', {
                    rules: [
                      {
                        required: true,
                        pattern: checkName,
                        message: <Translation>Please enter a valid application name</Translation>,
                      },
                    ],
                  })}
                />
              </FormItem>
            </Col>
            <Col span={12} style={{ padding: '0 8px' }}>
              <FormItem label={<Translation>Alias</Translation>}>
                <Input
                  name="alias"
                  placeholder={i18n.t('Give your app a more recognizable name').toString()}
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
              <NameSpaceForm field={this.field} projectList={namespaceList} />
            </Col>
            <Col span={12} style={{ padding: '0 8px' }}>
              <FormItem label={<Translation>Description</Translation>}>
                <Input
                  name="description"
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
              <FormItem label={'ApplicationYmal'} required={true}>
                <Upload request={this.customRequest}>
                  <Button text type="normal" className="padding-left-0">
                    <AiOutlineCloudUpload />
                    <Translation>Upload Yaml File</Translation>
                  </Button>
                </Upload>

                <div id="guide-code" className="guide-code">
                  <DefinitionCode
                    containerId="guide-code"
                    language={'yaml'}
                    readOnly={false}
                    {...init('kubeConfig')}
                    value={valueInfo}
                    ref={this.DefinitionCodeRef}
                  />
                </div>
              </FormItem>
            </Col>
          </Row>
        </Form>
      </div>
    );
  }
}

export default YmalConfig;
