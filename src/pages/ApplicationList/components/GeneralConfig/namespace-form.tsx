import React from 'react';
import type { Field } from '@b-design/ui';
import { Form, Input, Select, Button } from '@b-design/ui';
import { If } from 'tsx-control-statements/components';
import Translation from '../../../../components/Translation';
import { checkName } from '../../../../utils/common';

const FormItem = Form.Item;
type Props = {
  formItemLayout?: any;
  namespaceList: [];
  field: Field;
  handleSelectNameSpace?: () => {};
  onChange?: (namespace: string) => void;
  disableNew?: boolean;
};

type State = {
  showNameSpaceInput: boolean;
  inputNamespaceParam: string;
};

class NamespaceForm extends React.Component<Props, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      showNameSpaceInput: false,
      inputNamespaceParam: '',
    };
  }

  openNamespaceInput = () => {
    this.setState({
      showNameSpaceInput: true,
    });
  };

  closeNamespaceInput = () => {
    this.setState({
      showNameSpaceInput: false,
    });
  };

  render() {
    const { formItemLayout, namespaceList, field, disableNew } = this.props;
    const { showNameSpaceInput } = this.state;
    return (
      <React.Fragment>
        <If condition={namespaceList.length > 0}>
          <FormItem
            {...formItemLayout}
            label={<Translation>Project</Translation>}
            labelTextAlign="left"
            required={true}
          >
            <If condition={!showNameSpaceInput}>
              <div className="cluster-container">
                <Select
                  className="cluster-params-input"
                  mode="single"
                  dataSource={namespaceList}
                  {...field.init('namespace', { initValue: '' })}
                  placeholder={''}
                />
                <If condition={!disableNew}>
                  <Button
                    className="cluster-option-btn"
                    type="secondary"
                    onClick={this.openNamespaceInput}
                  >
                    <Translation>New</Translation>
                  </Button>
                </If>
              </div>
            </If>
            <If condition={showNameSpaceInput}>
              <div className="cluster-container">
                <Input
                  {...field.init('namespace', {
                    rules: [
                      { required: true },
                      { pattern: checkName, message: 'Please enter a valid project name' },
                    ],
                  })}
                  className="cluster-params-input"
                />
                <Button
                  className="cluster-option-btn"
                  type="secondary"
                  onClick={this.closeNamespaceInput}
                >
                  选择
                </Button>
              </div>
            </If>
          </FormItem>
        </If>
        <If condition={namespaceList.length === 0}>
          <FormItem {...formItemLayout} label={'namespace'} labelTextAlign="left" required={true}>
            <Input {...field.init('namespace')} />
          </FormItem>
        </If>
      </React.Fragment>
    );
  }
}

export default NamespaceForm;
