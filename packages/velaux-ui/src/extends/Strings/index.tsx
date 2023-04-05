import { Input, Button, Field } from '@alifd/next';
import React from 'react';

import './index.less';
import { If } from '../../components/If';
import { Translation } from '../../components/Translation';
import { AiOutlineDelete } from 'react-icons/ai';

type Props = {
  label?: string;
  value?: any;
  id: string;
  onChange: (value: any) => void;
  disabled: boolean;
};

type InputParams = {
  key: string;
  id: string;
  isFirst?: boolean;
  label?: boolean;
  value?: string;
  onChange: () => {};
  delete: (key: string) => {};
  disabled: boolean;
};

type ListParams = {
  key: string;
  value?: any;
};

type State = {
  inputList: ListParams[];
};

function InputItem(props: InputParams) {
  return (
    <div className="string-container">
      <Input
        htmlType="text"
        onChange={props.onChange}
        addonBefore={''}
        className="input"
        disabled={props.disabled}
        value={props.value}
      />
      <div className="remove-option-container">
        <If condition={!props.isFirst}>
          <AiOutlineDelete
            onClick={() => {
              props.delete(props.id);
            }}
          />
        </If>
      </div>
    </div>
  );
}

class Strings extends React.Component<Props, State> {
  field: any;
  constructor(props: Props) {
    super(props);
    const inputList: ListParams[] = [];
    if (props.value) {
      props.value.map((v: any, index: number) => {
        const key = Date.now().toString() + index;
        inputList.push({
          key,
          value: v,
        });
      });
    }
    this.state = {
      inputList,
    };
    this.field = new Field(this, {
      onChange: () => {
        this.changeValues();
      },
    });
  }

  componentDidMount = async () => {};

  changeValues = () => {
    const values = this.field.getValues();
    const inputList: ListParams[] = this.state.inputList;
    Object.keys(values).map((key) => {
      if (Array.isArray(inputList)) {
        inputList.forEach((item) => {
          if (item.key === key) {
            item.value = values[key];
          }
        });
      }
    });
    const valuesInfo = inputList.map((item: ListParams) => item.value);
    this.props.onChange(valuesInfo);
  };

  addInputItem = () => {
    const { inputList } = this.state;
    const key = Date.now().toString();
    inputList.push({
      key,
    });
    this.setState({
      inputList,
    });
  };

  removeInputItem = (key: string) => {
    const { inputList } = this.state;
    inputList.forEach((item, i) => {
      if (item.key === key) {
        inputList.splice(i, 1);
        this.field.remove(key);
      }
    });
    this.setState(
      {
        inputList,
      },
      () => {
        this.changeValues();
      }
    );
  };

  render() {
    const { inputList } = this.state;
    const { init } = this.field;
    const { label, disabled } = this.props;
    return (
      <div className="strings-container">
        {inputList.map((item) => (
          <InputItem
            {...init(item.key)}
            key={item.key}
            value={item.value}
            delete={(id) => this.removeInputItem(id)}
            id={item.key}
            label={label}
          />
        ))}
        <div className="add-btn-container">
          <Button disabled={disabled} size="small" onClick={this.addInputItem} ghost="light">
            <Translation>Add</Translation>
          </Button>
        </div>
      </div>
    );
  }
}

export default Strings;
