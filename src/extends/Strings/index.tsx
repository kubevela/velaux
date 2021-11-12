import React from 'react';
import { Input, Button, Field, Icon } from '@b-design/ui';
import { If } from 'tsx-control-statements/components';
import './index.less';

type Props = {
  label?: string;
  value: boolean;
  id: string;
  onChange: (value: any) => void;
};

type InputParams = {
  key: string;
  id: string;
  isFirst?: boolean;
  label?: boolean;
  onChange: () => {};
  delete: (key: string) => {};
};

type ListParams = {
  key: string;
};

type State = {
  inputList: Array<ListParams>;
};

function InputItem(props: InputParams) {
  return (
    <div className="string-container">
      <Input htmlType="text" onChange={props.onChange} addonBefore={''} className="input" />
      <div className="remove-option-container">
        <If condition={!props.isFirst}>
          <Icon
            type="ashbin"
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
    this.state = {
      inputList: [],
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

    const result = Object.keys(values)
      .map((key) => values[key])
      .filter((item) => !!item);
    this.props.onChange(result);
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
      },
    );
  };

  render() {
    const { inputList } = this.state;
    const { init } = this.field;
    const { label } = this.props;
    return (
      <div>
        <InputItem
          {...init('init', {
            name: 'first',
          })}
          isFirst
          label={label}
        />
        {inputList.map((item) => (
          <InputItem
            {...init(item.key)}
            key={item.key}
            delete={(id) => this.removeInputItem(id)}
            id={item.key}
            label={label}
          />
        ))}
        <div className="add-btn-container">
          <Button onClick={this.addInputItem} ghost="light">
            添加
          </Button>
        </div>
      </div>
    );
  }
}

export default Strings;
