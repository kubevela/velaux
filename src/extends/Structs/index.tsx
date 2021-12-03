import React from 'react';
import { Form, Icon, Field, Button, SplitButton } from '@b-design/ui';
import { If } from 'tsx-control-statements/components';
import type { UIParam, GroupOption } from '../../interface/application';
import UISchema from '../../components/UISchema';
import type { Rule } from '@alifd/field';
import './index.less';

type Props = {
  _key?: string;
  parameterGroupOption: GroupOption[] | undefined;
  param: UIParam[] | undefined;
  onChange?: (params: any) => void;
  id: string;
  value: any;
};

type State = {
  structList: any[];
};

type StructItemProps = {
  option?: string[];
  param?: UIParam[];
  id: string;
  init: any;
  delete: (id: string) => void;
};
class StructItem extends React.Component<StructItemProps> {
  uiRef: React.RefObject<UISchema>;
  constructor(props: StructItemProps) {
    super(props);
    this.state = {
      structList: [],
    };
    this.uiRef = React.createRef();
  }
  validator = (rule: Rule, value: any, callback: (error?: string) => void) => {
    this.uiRef.current?.validate(callback);
  };
  render() {
    const { option, param, id, init } = this.props;
    let uiSchemas = param;
    if (option && option.length > 0) {
      const paramMap =
        param &&
        param.reduce((pre: any, next) => {
          pre[next.jsonKey] = next;
          return pre;
        }, {});
      uiSchemas = option.map((key: string) => paramMap[key]);
    }

    return (
      <div className="struct-item-container">
        <div className="struct-item-content">
          <UISchema
            {...init(`struct${id}`, {
              rules: [
                {
                  validator: this.validator,
                  message: 'please check config item',
                },
              ],
            })}
            uiSchema={uiSchemas}
            inline
            ref={this.uiRef}
          />
        </div>
        <div className="remove-option-container">
          <Icon
            type="ashbin"
            onClick={() => {
              if (this.props.delete) {
                this.props.delete(this.props.id);
              }
            }}
          />
        </div>
      </div>
    );
  }
}

class Structs extends React.Component<Props, State> {
  field: Field;
  constructor(props: Props) {
    super(props);
    this.state = {
      structList: [],
    };
    this.field = new Field(this, {
      onChange: () => {
        this.setValues();
      },
    });
  }

  componentDidMount = () => {
    this.initValue();
  };

  initValue = () => {
    const { value, parameterGroupOption } = this.props;
    if (value) {
      const keyMap = new Map();
      if (parameterGroupOption) {
        parameterGroupOption.map((item) => {
          if (item && item.keys) {
            keyMap.set(item.keys.sort().join(), item);
          }
        });
      }
      const structList = Array<any>();
      value.map((item: any, index: number) => {
        const key = Date.now().toString() + index;
        const valueKeys = [];
        for (const itemkey in item) {
          valueKeys.push(itemkey);
        }
        const option = keyMap.get(valueKeys.sort().join());
        structList.push({
          key,
          option: option?.keys,
          value: value,
        });
        this.field.setValue('struct' + key, item);
      });
      this.setState({ structList });
    }
  };

  setValues = () => {
    const values: any = this.field.getValues();
    const { onChange } = this.props;
    const result = Object.keys(values).map((key) => {
      return values[key];
    });
    if (onChange) {
      onChange(result);
    }
  };

  validate = (callback: (error?: string) => void) => {
    this.field.validate((errors: any) => {
      if (errors) {
        callback('structs validate failure');
        return;
      }
      callback();
    });
  };

  addStructPlanItem = (option?: GroupOption, value?: any) => {
    this.field.validate((error: any) => {
      if (error) {
        console.log(error);
        return;
      }
      const { structList } = this.state;
      const key = Date.now().toString();
      structList.push({
        key,
        option: option?.keys,
        value: value,
      });
      this.setState({
        structList,
      });
    });
  };

  removeStructPlanItem = (key: string) => {
    const { structList } = this.state;
    structList.forEach((item, i) => {
      if (item.key === key) {
        structList.splice(i, 1);
      }
    });
    this.field.remove('struct' + key);
    this.setValues();
    this.setState({
      structList,
    });
  };

  render() {
    const { structList } = this.state;
    const { param, parameterGroupOption = [] } = this.props;
    const { init } = this.field;
    return (
      <div className="struct-plan-container">
        <div className="struct-plan-group">
          <Form field={this.field}>
            {structList.map((struct: any) => (
              <StructItem
                delete={this.removeStructPlanItem}
                id={struct.key}
                key={struct.key}
                init={init}
                option={struct.option}
                param={param}
              />
            ))}
          </Form>
        </div>
        <div className="struct-plan-option">
          <If condition={parameterGroupOption.length === 0}>
            <Button
              onClick={() => {
                this.addStructPlanItem();
              }}
              type="secondary"
            >
              Add
            </Button>
          </If>
          <If condition={parameterGroupOption.length !== 0}>
            <SplitButton label="Add" type="secondary" autoWidth={false}>
              {parameterGroupOption?.map((item) => (
                <SplitButton.Item
                  key={item.keys.join(',')}
                  onClick={() => this.addStructPlanItem(item)}
                >
                  {item.label || item.keys.join(':')}
                </SplitButton.Item>
              ))}
            </SplitButton>
          </If>
        </div>
      </div>
    );
  }
}

export default Structs;
