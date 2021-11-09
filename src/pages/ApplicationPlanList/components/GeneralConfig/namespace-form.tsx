import React, { createRef, LegacyRef } from 'react';
import { Form, Input, Select, Field, Radio, Button } from '@b-design/ui';
import { If } from 'tsx-control-statements/components';
import Translation from '../../../../components/Translation';

const FormItem = Form.Item;
type Props = {
  formItemLayout?: any;
  namespaceList: [];
  disabled: boolean;
  field: Field;
  handleSelectNameSpace?: () => {};
};

type State = {
  showNameSpaceInput: boolean;
  inputNamespaceParam: string;
};

class NamespaceForm extends React.Component<Props, State> {
  field: any;
  constructor(props: Props) {
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
    const { formItemLayout, namespaceList, field, disabled = false } = this.props;
    const { showNameSpaceInput } = this.state;
    return (
      <React.Fragment>
        <If condition={namespaceList.length > 0}>
          <FormItem
            {...formItemLayout}
            label={<Translation>Namespace</Translation>}
            labelTextAlign="left"
            required={true}
          >
            <If condition={!showNameSpaceInput}>
              <div className="cluster-container">
                <Select
                  className="cluster-params-input"
                  mode="single"
                  dataSource={namespaceList}
                  {...field.init('namespace', { initValue: 'default' })}
                  disabled={disabled}
                  placeholder={''}
                />
                <Button
                  className="cluster-option-btn"
                  type="secondary"
                  onClick={this.openNamespaceInput}
                >
                  新建
                </Button>
              </div>
            </If>
            <If condition={showNameSpaceInput}>
              <div className="cluster-container">
                <Input
                  {...field.init('namespace')}
                  disabled={disabled}
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
            <Input {...field.init('namespace')} disabled={disabled} />
          </FormItem>
        </If>
      </React.Fragment>
    );
  }
}

export default NamespaceForm;
