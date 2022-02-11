import React from 'react';
import { Form, Icon, Field, Button } from '@b-design/ui';
import { If } from 'tsx-control-statements/components';
import type { UIParam, GroupOption } from '../../interface/application';
import UISchema from '../../components/UISchema';
import SpectionGroup from '../../extends/SpectionGroup';
import type { Rule } from '@alifd/field';
import './index.less';

type Props = {
  _key?: string;
  parameterGroupOption: GroupOption[] | undefined;
  param: UIParam[] | undefined;
  onChange?: (params: any) => void;
  registerForm: (form: Field) => void;
  id: string;
  value: any;
};

type State = {
  structList: any[];
  closed: boolean;
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
        <If condition={param && param.length > 3}>
          <div className="struct-item-content">
            <SpectionGroup
              id={id}
              delete={(id: string) => { this.props.delete(this.props.id) }}
            >
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
            </SpectionGroup>
          </div>
        </If>
        <If condition={param && param.length <= 3}>
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
        </If>

      </div >
    );
  }
}

class Structs extends React.Component<Props, State> {
  field: Field;
  constructor(props: Props) {
    super(props);
    this.state = {
      structList: [],
      closed: false,
    };
    this.field = new Field(this, {
      onChange: () => {
        this.setValues();
      },
    });
    this.props.registerForm(this.field);
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

  toggleShowClass = () => {
    const { closed } = this.state;
    this.setState({
      closed: !closed,
    });
  };

  getConditionStructList = () => {
    const { structList, closed } = this.state;
    if (closed && structList) {
      return [structList[0]];
    } else {
      return structList || [];
    }
  }

  render() {
    const { structList, closed } = this.state;
    const { param, parameterGroupOption = [] } = this.props;
    const { init } = this.field;
    const conditionStructList = this.getConditionStructList();
    return (
      <div className="struct-plan-container">
        <div className="struct-plan-group">
          <Form field={this.field}>
            <If condition={structList && structList.length > 1}>
              <div className="flexright">
                <Icon
                  onClick={this.toggleShowClass}
                  size={'small'}
                  type={closed ? 'arrow-down1' : 'arrow-up'}
                />
              </div>
            </If>

            {conditionStructList.map((struct: any) => (
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
            <Button.Group>
              {parameterGroupOption?.map((item) => (
                <Button
                  type="secondary"
                  key={item.keys.join(',')}
                  onClick={() => this.addStructPlanItem(item)}
                >
                  {item.label || item.keys.join(':')}
                </Button>
              ))}
            </Button.Group>
          </If>
        </div>
      </div>
    );
  }
}

export default Structs;
