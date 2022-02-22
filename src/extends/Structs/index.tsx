import React from 'react';
import { Form, Icon, Field, Button } from '@b-design/ui';
import { If } from 'tsx-control-statements/components';
import type { UIParam, GroupOption } from '../../interface/application';
import UISchema from '../../components/UISchema';
import ArrayItemGroup from '../ArrayItemGroup';
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
  label: string;
  mode: 'new' | 'edit';
};

type State = {
  structList: any[];
};

type StructItemProps = {
  option?: string[];
  param?: UIParam[];
  id: string;
  init: any;
  labelTitle: string | React.ReactElement;
  delete: (id: string) => void;
  mode: 'new' | 'edit';
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
  getParamCount = (params: UIParam[] | undefined) => {
    let count = 0;
    if (!params && !Array.isArray(params)) {
      return count;
    }
    params.map((p) => {
      if (!p.disable && p.uiType != 'Ignore' && p.uiType != 'InnerGroup') {
        count += 1;
      }
      if (!p.disable && p.subParameters) {
        count += this.getParamCount(p.subParameters);
      }
    });
    return count;
  };
  render() {
    const { option, param, id, init, labelTitle } = this.props;
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
    const paramCount = this.getParamCount(uiSchemas);
    const itemCount = uiSchemas?.filter((p) => !p.disable).length || 1;
    return (
      <div className="struct-item-container">
        <If condition={paramCount > 3}>
          <div className="struct-item-content">
            <ArrayItemGroup
              id={id}
              labelTitle={labelTitle}
              delete={(structId: string) => {
                this.props.delete(structId);
              }}
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
                mode={this.props.mode}
              />
            </ArrayItemGroup>
          </div>
        </If>
        <If condition={paramCount <= 3}>
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
              maxColSpan={24 / itemCount}
              inline
              ref={this.uiRef}
              mode={this.props.mode}
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
    this.props.registerForm(this.field);
  }

  componentDidMount = () => {
    this.initValue();
  };

  initValue = () => {
    const { value, parameterGroupOption } = this.props;
    if (value) {
      const keyMap = new Map();
      let firstOption: GroupOption | undefined = undefined;
      if (parameterGroupOption) {
        parameterGroupOption.map((item) => {
          if (item && item.keys) {
            if (!firstOption) {
              firstOption = item;
            }
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
          option: option?.keys || firstOption?.keys,
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

  render() {
    const { structList } = this.state;
    const { param, parameterGroupOption = [], label } = this.props;
    const { init } = this.field;
    return (
      <div className="struct-plan-container">
        <div className="struct-plan-group">
          <Form field={this.field}>
            {structList.map((struct: any) => {
              const fieldObj: any = this.field.getValues();
              const name = fieldObj[`struct${struct.key}`]?.name || '';
              let labelTitle: string | React.ReactElement = label;
              if (name) {
                labelTitle = (
                  <span>
                    {label}: <span style={{ marginLeft: '8px' }}>{name}</span>{' '}
                  </span>
                );
              }
              return (
                <StructItem
                  delete={this.removeStructPlanItem}
                  id={struct.key}
                  key={struct.key}
                  init={init}
                  option={struct.option}
                  param={param}
                  labelTitle={labelTitle}
                  mode={this.props.mode}
                />
              );
            })}
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
