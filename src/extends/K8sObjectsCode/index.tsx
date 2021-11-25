import React from 'react';
import { Field } from '@b-design/ui';
import { Upload, Button, Icon } from '@b-design/ui';
import DefinitionCode from '../../components/DefinitionCode';
import Translation from '../../components/Translation';
import * as yaml from 'js-yaml';
import { If } from 'tsx-control-statements/components';

type Props = {
  value: any;
  id: string;
  onChange: (value: any) => void;
};

type State = {
  message: string;
};

class K8sObjectsCode extends React.Component<Props, State> {
  form: Field;
  constructor(props: Props) {
    super(props);
    this.state = {
      message: '',
    };
    this.form = new Field(this, {
      onChange: () => {
        const values: { code: string } = this.form.getValues();
        this.onChange(values.code);
      },
    });
  }

  componentDidMount = () => {
    const { value } = this.props;
    this.setValues(value);
  };
  componentWillReceiveProps(nextProps: Props) {
    const { value } = nextProps;
    if (value !== this.props.value) {
      this.setValues(value);
    }
  }

  setValues = (value: any) => {
    if (value) {
      try {
        const code = yaml.dump(value);
        this.form.setValues({ code: code });
      } catch {}
    }
  };

  onChange = (v: string) => {
    const { onChange, value } = this.props;
    if (onChange) {
      try {
        let object = yaml.load(v);
        if (!(object instanceof Array)) {
          object = [object];
        }
        if (yaml.dump(value) != v) {
          onChange(object);
        }
        this.setState({ message: '' });
      } catch (error: any) {
        if ((error.message = 'expected a single document in the stream, but found more')) {
          try {
            const objects = yaml.loadAll(v);
            if (yaml.dump(value) != v) {
              onChange(objects);
            }
            this.setState({ message: '' });
          } catch (err: any) {
            this.setState({ message: err.message });
          }
        } else {
          this.setState({ message: error.message });
        }
      }
    }
  };

  customRequest = (option: any) => {
    const reader = new FileReader();
    const fileselect = option.file;
    reader.readAsText(fileselect);
    reader.onload = () => {
      this.form.setValue('code', reader.result?.toString() || '');
    };
    return {
      file: File,
      abort() {},
    };
  };

  render() {
    const { id } = this.props;
    const { init } = this.form;
    const { message } = this.state;
    return (
      <div>
        <If condition={message}>
          <span style={{ color: 'red' }}>{message}</span>
        </If>
        <Upload request={this.customRequest}>
          <Button text type="normal" className="padding-left-0">
            <Icon type="cloudupload" />
            <Translation>Upload Yaml File</Translation>
          </Button>
        </Upload>

        <div id={id} className="guide-code">
          <DefinitionCode containerId={id} language={'yaml'} readOnly={false} {...init('code')} />
        </div>
      </div>
    );
  }
}

export default K8sObjectsCode;
