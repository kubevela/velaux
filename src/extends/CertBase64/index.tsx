import React from 'react';
import { Field } from '@b-design/ui';
import { Upload, Button, Icon } from '@b-design/ui';
import DefinitionCode from '../../components/DefinitionCode';
import Translation from '../../components/Translation';
import { decode, encode } from 'base-64';
import { v4 as uuid } from 'uuid';
import { If } from 'tsx-control-statements/components';

type Props = {
  value: any;
  id: string;
  onChange: (value: any) => void;
  disabled: boolean;
};

type State = {
  message: string;
  containerId: string;
};

class CertBase64 extends React.Component<Props, State> {
  form: Field;
  constructor(props: Props) {
    super(props);
    this.state = {
      message: '',
      containerId: uuid(),
    };
    this.form = new Field(this, {
      onChange: () => {
        const values: { cert: string } = this.form.getValues();
        this.onChange(values.cert);
      },
    });
  }

  componentDidMount = () => {
    const { value } = this.props;
    this.setValues(value);
  };

  setValues = (value: string) => {
    if (value) {
      this.form.setValue('cert', decode(value));
    }
  };

  onChange = (v: string) => {
    const { onChange } = this.props;
    if (onChange) {
      onChange(encode(v));
    }
  };

  customRequest = (option: any) => {
    const reader = new FileReader();
    const fileselect = option.file;
    reader.readAsText(fileselect);
    reader.onload = () => {
      this.form.setValue('cert', reader.result?.toString() || '');
    };
    return {
      file: File,
      abort() {},
    };
  };

  render() {
    const { id, disabled } = this.props;
    const { init } = this.form;
    const { message, containerId } = this.state;
    return (
      <div id={id}>
        <If condition={message}>
          <span style={{ color: 'red' }}>{message}</span>
        </If>

        <Upload disabled={disabled} request={this.customRequest}>
          <Button text type="normal" className="padding-left-0">
            <Icon type="cloudupload" />
            <Translation>Upload File</Translation>
          </Button>
        </Upload>

        <div id={containerId} className="guide-code">
          <DefinitionCode
            containerId={containerId}
            language={'yaml'}
            readOnly={disabled}
            {...init('cert')}
          />
        </div>
      </div>
    );
  }
}

export default CertBase64;
