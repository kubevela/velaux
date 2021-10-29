import React from 'react';
import {
  Button,
  Message,
  Grid,
  Dialog,
  Form,
  Input,
  Select,
  Upload,
  Field,
  Icon,
} from '@b-design/ui';
import { addClust, addClustDialog, UPLOADYMALFILE } from '../../../../constants';
import DefinitionCode from '../../../../components/DefinitionCode';
import defineTheme from '../../../../components/DefinitionCode/theme';
import { startEndNotEmpty, urlRegular } from '../../../../utils/common';
import './index.less';

type Props = {
  visible: boolean;
  page?: number;
  pageSize?: number;
  query?: string;
  setVisible: (visible: boolean) => void;
  dispatch: ({}) => {};
};

type State = {};

class AddClustDialog extends React.Component<Props, State> {
  field: Field;
  DefinitionCodeRef: React.RefObject<DefinitionCode>;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.DefinitionCodeRef = React.createRef();
  }

  onClose = () => {
    this.props.setVisible(false);
    this.resetField();
  };

  onOk = () => {
    const { page, pageSize, query = '' } = this.props;
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { name, description, dashboardURL, kubeConfig } = values;
      const params = {
        name,
        description,
        dashboardURL,
        kubeConfig,
        icon: '',
        page,
        pageSize,
        query,
      };
      this.props.dispatch({
        type: 'clusters/createCluster',
        payload: params,
      });
    });

    this.props.setVisible(false);
    this.resetField();
  };

  resetField() {
    this.field.setValues({
      name: '',
      description: '',
      dashboardURL: '',
      kubeConfig: '',
    });
  }

  onError = (r: {}) => {};

  customRequest = (option: any) => {
    let reader = new FileReader();
    let fileselect = option.file;
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

  render() {
    const { visible } = this.props;
    const {
      name,
      describe,
      namePlaceHold,
      describePlaceHold,
      kubeAPI,
      dashboardURL,
      dashboarPlaceHold,
    } = addClustDialog;
    const FormItem = Form.Item;
    const formItemLayout = {
      labelCol: {
        fixedSpan: 6,
      },
      wrapperCol: {
        span: 18,
      },
    };
    const init = this.field.init;
    const values: { kubeConfig: string } = this.field.getValues();
    const valueInfo = values.kubeConfig || '';
    return (
      <div>
        <Dialog
          className="dialog-clust-wraper"
          title={addClust}
          autoFocus={true}
          visible={visible}
          onOk={this.onOk}
          onCancel={this.onClose}
          onClose={this.onClose}
          footerActions={['ok', 'cancel']}
          footerAlign="center"
        >
          <Form {...formItemLayout} field={this.field}>
            <FormItem label={name} required>
              <Input
                htmlType="name"
                name="name"
                placeholder={namePlaceHold}
                {...init('name', {
                  rules: [
                    {
                      required: true,
                      pattern: startEndNotEmpty,
                      message: 'content cannot be empty',
                    },
                  ],
                })}
              />
            </FormItem>

            <FormItem label={describe}>
              <Input
                htmlType="describe"
                name="describe"
                placeholder={describePlaceHold}
                {...init('description')}
              />
            </FormItem>

            <FormItem label={dashboardURL}>
              <Input
                htmlType="dashboardURL"
                name="dashboardURL"
                placeholder={dashboarPlaceHold}
                {...init('dashboardURL', {
                  rules: [
                    {
                      required: false,
                      pattern: urlRegular,
                      message: 'Input according to URL specification',
                    },
                  ],
                })}
              />
            </FormItem>

            <FormItem label={kubeAPI}>
              <Upload request={this.customRequest}>
                <Button text type="normal" className="padding-left-0">
                  <Icon type="cloudupload" />
                  {UPLOADYMALFILE}
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
        </Dialog>
      </div>
    );
  }
}

export default AddClustDialog;
