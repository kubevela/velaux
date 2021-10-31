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
import { addClust } from '../../../../constants';

type Props = {
  visible: boolean;
  page?: number;
  pageSize?: number;
  query?: string;
  setVisible: (visible: boolean) => void;
  dispatch: ({}) => {};
};

type State = {};

class RegistryManageDialog extends React.Component<Props, State> {
  field: Field;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
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
        ></Dialog>
      </div>
    );
  }
}

export default RegistryManageDialog;
