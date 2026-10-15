import type { Rule } from '@alifd/field';
import { Form, Field, Button } from '@alifd/next';
import React from 'react';

import UISchema from '../../components/UISchema';
import type { Scope, ExpressionContext } from '../../components/UISchema';
import type { UIParam, GroupOption } from '@velaux/data';
import ArrayItemGroup from '../ArrayItemGroup';

import './index.less';
import { If } from '../../components/If';
import { AiOutlineDelete } from 'react-icons/ai';

type Props = {
  _key?: string;
  parameterGroupOption: GroupOption[] | undefined;
  param: UIParam[] | undefined;
  onChange?: (params: any) => void;
  registerForm: (form: Field) => void;
  id: string;
  value?: any;
  label: string;
  mode: 'new' | 'edit';
  // parentScope is the form holding the list, which an item's condition
  // reaches with `../`.
  parentScope?: Scope;
  expressions?: ExpressionContext;
  // format `table` lays each item out as one row.
  format?: string;
  // rowKey names the field that identifies an item: unique, and its title.
  rowKey?: string;
  // itemLabel names the field that titles an item.
  itemLabel?: string;
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
  parentScope?: Scope;
  expressions?: ExpressionContext;
  table?: boolean;
  // duplicate reports the item's row key when another item has it too.
  duplicate?: () => string | undefined;
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
    const dup = this.props.duplicate && this.props.duplicate();
    if (dup) {
      callback(`${dup} is used by another item`);
      return;
    }
    this.uiRef.current?.validate(callback);
  };
  getParamCount = (params: UIParam[] | undefined) => {
    let count = 0;
    if (!params && !Array.isArray(params)) {
      return count;
    }
    params.map((p) => {
      if (!p.disable && p.uiType != 'Ignore' && p.uiType != 'InnerGroup') {
        if (
          ['Structs', 'Strings', 'CertBase64', 'Group', 'ImageInput', 'K8sObjectsCode', 'KV'].indexOf(p.uiType) > -1
        ) {
          count += 3;
        } else {
          count += 1;
        }
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
    const paramCount = this.props.table ? 0 : this.getParamCount(uiSchemas);
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
                parentScope={this.props.parentScope}
                expressions={this.props.expressions}
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
              parentScope={this.props.parentScope}
              expressions={this.props.expressions}
              mode={this.props.mode}
            />
          </div>
          <div className="remove-option-container">
            <AiOutlineDelete
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
      const structList: any[] = [];
      value.map((item: any, index: number) => {
        const key = Date.now().toString() + index;
        const valueKeys: string[] = [];
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

  // duplicateKey is the row key of the item when another item has the same
  // one.
  duplicateKey = (key: string): string | undefined => {
    const { rowKey } = this.props;
    if (!rowKey) {
      return undefined;
    }
    const values: any = this.field.getValues();
    const own = values[`struct${key}`]?.[rowKey];
    if (own === undefined || own === '') {
      return undefined;
    }
    const clash = Object.keys(values).some((k) => k !== `struct${key}` && values[k]?.[rowKey] === own);
    return clash ? String(own) : undefined;
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

  // duplicateKeys are the row keys more than one item has.
  duplicateKeys = (): string[] => {
    const { rowKey } = this.props;
    if (!rowKey) {
      return [];
    }
    const values: any = this.field.getValues();
    const seen = new Set<string>();
    const dups = new Set<string>();
    Object.keys(values).forEach((k) => {
      const v = values[k]?.[rowKey];
      if (v === undefined || v === '') {
        return;
      }
      if (seen.has(String(v))) {
        dups.add(String(v));
      }
      seen.add(String(v));
    });
    return Array.from(dups);
  };

  render() {
    const { structList } = this.state;
    const { param, parameterGroupOption = [], label } = this.props;
    const { init } = this.field;
    const dups = this.duplicateKeys();
    return (
      <div className="struct-plan-container">
        <div className="struct-plan-group">
          <Form field={this.field}>
            {structList.map((struct: any) => {
              const fieldObj: any = this.field.getValues();
              const titleKey = this.props.itemLabel || this.props.rowKey || 'name';
              const name = fieldObj[`struct${struct.key}`]?.[titleKey] || '';
              let labelTitle: string | React.ReactElement = label;
              if (name) {
                labelTitle = (
                  <span>
                    {label}: <span style={{ marginLeft: '8px' }}>{name}</span>
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
                  parentScope={this.props.parentScope}
                  expressions={this.props.expressions}
                  table={this.props.format === 'table'}
                  duplicate={() => this.duplicateKey(struct.key)}
                />
              );
            })}
          </Form>
          <If condition={dups.length > 0}>
            <div className="struct-plan-error">{`${dups.join(', ')} is used by more than one item`}</div>
          </If>
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
                <Button type="secondary" key={item.keys.join(',')} onClick={() => this.addStructPlanItem(item)}>
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
