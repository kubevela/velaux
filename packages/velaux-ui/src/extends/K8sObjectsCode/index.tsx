import { Upload, Button, Message, Field } from '@alifd/next';
import * as yaml from 'js-yaml';
import React from 'react';
import { AiOutlineCloudUpload } from 'react-icons/ai';
import { v4 as uuid } from 'uuid';

import DefinitionCode from '../../components/DefinitionCode';
import { If } from '../../components/If';
import { Translation } from '../../components/Translation';

import type { KubernetesObject } from './objects';

type Props = {
  value?: any;
  id: string;
  onChange: (value: any) => void;
};

type State = {
  message: string;
  containerId: string;
  showButton: boolean;
};

class K8sObjectsCode extends React.Component<Props, State> {
  form: Field;
  constructor(props: Props) {
    super(props);
    this.state = {
      message: '',
      containerId: uuid(),
      showButton: false,
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

  setValues = (value: KubernetesObject[]) => {
    if (value) {
      try {
        let code = '---\n';
        if (value instanceof Array) {
          value.map((res) => {
            if (res) {
              code = code + yaml.dump(res) + '---\n';
            }
          });
        } else {
          code = yaml.dump(value) + '---\n';
        }
        this.form.setValues({ code: code });
      } catch {}
    }
  };

  onChange = (v: string) => {
    const { onChange, value } = this.props;
    if (onChange) {
      try {
        let object: any = yaml.load(v);
        if (!(object instanceof Array)) {
          object = [object];
        }
        object = object.filter((ob: any) => ob != null);
        if (yaml.dump(value) != v) {
          onChange(object);
        }
        this.setState({ message: '' });
      } catch (error: any) {
        if ((error.message = 'expected a single document in the stream, but found more')) {
          try {
            let objects = yaml.loadAll(v);
            if (yaml.dump(value) != v) {
              objects = objects.filter((ob: any) => ob != null);
              onChange(objects);
            }
            this.setState({
              message: '',
            });
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

  onConvert2WebService = () => {};

  render() {
    const { id } = this.props;
    const { init } = this.form;
    const { message, containerId, showButton } = this.state;
    return (
      <div id={id}>
        <If condition={message}>
          <span style={{ color: 'red' }}>{message}</span>
        </If>

        <Message type="notice" style={{ marginTop: '16px' }}>
          <Translation>
            The input data will be automatically formatted. Ensure that the input data is a valid k8s resource YAML.
          </Translation>
        </Message>

        <Upload request={this.customRequest}>
          <Button text type="normal" className="padding-left-0">
            <AiOutlineCloudUpload />
            <Translation>Upload Yaml File</Translation>
          </Button>
        </Upload>

        <div id={containerId} className="guide-code">
          <DefinitionCode containerId={containerId} language={'yaml'} readOnly={false} {...init('code')} />
        </div>

        <If condition={showButton}>
          <div style={{ marginTop: '16px' }}>
            <span style={{ fontSize: '14px', color: '#000', marginRight: '16px' }}>
              <Translation>Convert the kubernetes resource component to the webservice component?</Translation>
            </span>
            <Button type="secondary" onClick={this.onConvert2WebService}>
              Yes
            </Button>
          </div>
        </If>
      </div>
    );
  }
}

export default K8sObjectsCode;
