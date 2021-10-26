import React from 'react';
import { Button, Message, Grid, Dialog, Form, Input, Select, Upload, Field } from '@b-design/ui';
import Translation from '../../../../components/Translation';
import { addClust, addClustDialog, UPLOADYMALFILE } from '../../../../constants';
import DefinitionCode from '../../../../components/DefinitionCode';
import defineTheme from './theme';
import './index.less';

type Props = {
  visible: boolean;
  page?: number;
  pageSize?: number;
  query?: string;
  setVisible: (visible: boolean) => void;
  dispatch: ({}) => {};
};

type State = {
  kubeConfig: string | ArrayBuffer;
};

class AddClustDialog extends React.Component<Props, State> {
  field: any;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.state = {
      kubeConfig: '',
    };
  }

  onClose = () => {
    this.props.setVisible(false);
    this.resetField();
  };
  onOk = () => {
    const { page, pageSize, query = '' } = this.props;
    const { kubeConfig } = this.state;
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { name, description, dashboardURL } = values;
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
    });
    this.setState({ kubeConfig: '' });
  }

  onError = (r: {}) => {
    console.log('onError callback');
    this.setState({
      kubeConfig: '',
    });
  };

  customRequest = (option: any) => {
    let reader = new FileReader();
    let fileselect = option.file;
    reader.readAsText(fileselect);
    reader.onload = () => {
      console.log(reader.result);
      this.setState({ kubeConfig: reader.result?.toString() || '' });
    };
    return {
      file: File,
      onError: this.onError,
      abort() {},
    };
  };

  changeCode = (value: string) => {
    this.setState({ kubeConfig: value || '' });
  };

  render() {
    const { Row, Col } = Grid;
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
    const { kubeConfig } = this.state;
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
            <FormItem label={name}>
              <Input htmlType="name" name="name" placeholder={namePlaceHold} {...init('name')} />
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
                {...init('dashboardURL')}
              />
            </FormItem>

            <FormItem label={kubeAPI}>
              <div id="guideCode" className="guideCode">
                <DefinitionCode
                  containerId="guideCode"
                  language={''}
                  readOnly={false}
                  value={kubeConfig}
                  defineTheme={defineTheme}
                  onChange={this.changeCode}
                />
              </div>
              <Upload request={this.customRequest}>
                <Button type="secondary" className="add-btn">
                  {UPLOADYMALFILE}
                </Button>
              </Upload>
            </FormItem>
          </Form>
        </Dialog>
      </div>
    );
  }
}

export default AddClustDialog;
