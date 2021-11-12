import React from 'react';
import {
  Form,
  Input,
  Select,
  Icon,
  Field,
  Button,
  Dropdown,
  Menu,
  SplitButton,
} from '@b-design/ui';
import { If } from 'tsx-control-statements/components';
import { UIParam, UIParamValidate } from '../../interface/application';
import UISchema from '../../components/UISchema';
import './index.less';
type Props = {
  _key?: string;
  parameterGroupOption: string[][] | undefined;
  param: Array<UIParam> | undefined;
  onChange?: (params: any) => void;
  value: any;
};

type State = {
  structList: Array<any>;
};

type StructItemType = {
  namespace: string;
  name: string;
  description?: string;
};

type StructPlanParams = {
  key: string;
  id: string;
  itemLength: number;
  init: any;
  option: any;
  param: Array<UIParam> | undefined;
  onChange?: () => {};
  delete?: (key: string) => void;
};

function StructItem(props: StructPlanParams) {
  const { option, param, id, init } = props;
  let uiSchemas = param;
  if (option.length > 0) {
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
        <UISchema uiSchema={uiSchemas} inline _key={id} {...init(`struct${id}`)} />
      </div>
      <div className="remove-option-container">
        <If condition={props.itemLength !== 1}>
          <Icon
            type="ashbin"
            onClick={() => {
              props.delete && props.delete(props.id);
            }}
          />
        </If>
      </div>
    </div>
  );
}

class Structs extends React.Component<Props, State> {
  field: any;
  constructor(props: Props) {
    super(props);
    const { parameterGroupOption = [] } = props;

    this.state = {
      structList: [],
    };
    this.field = new Field(this, {
      onChange: () => {
        this.setValues();
      },
    });
  }

  componentDidMount = async () => {
    const { parameterGroupOption = [] } = this.props;
    const structList = [
      {
        key: Date.now().toString(),
        option: parameterGroupOption[0] || [],
      },
    ];
    this.setState({
      structList,
    });
  };

  setValues = () => {
    const values = this.field.getValues();
    const { onChange } = this.props;
    const result = Object.keys(values).map((key) => {
      return values[key];
    });
    onChange && onChange(result);
  };

  addStructPlanItem = (option?: any) => {
    this.field.validate((error: any) => {
      if (error) {
        return;
      }
      const { structList } = this.state;
      const key = Date.now().toString();
      if (key) {
        structList.push({
          key,
          option,
        });
      } else {
        console.log(key);
      }

      this.setState({
        structList,
      });
    });
  };

  removeStructPlanItem = (key: string) => {
    const { structList } = this.state;
    structList.forEach((item, i) => {
      // 数据移除
      if (item.key === key) {
        structList.splice(i, 1);
      }
    });
    // StructPLAN_KEY_LIST.forEach((_key) => {
    //   // 移除表单校验
    //   this.field.remove(`${key}-${_key}`);
    // });
    this.setState({
      structList,
    });
  };

  getValues = (): Array<StructItemType> | null => {
    let hasError = false;
    this.field.validate();
    const errors = this.field.getErrors();
    Object.keys(errors).forEach((key) => {
      if (errors[key]) {
        hasError = true;
      }
    });
    if (hasError) {
      return null;
    } else {
      let allValues: Array<StructItemType> = [];
      // const values = this.field.getValues();
      // const { structList } = this.state;
      // const keyMap = structList.reduce((preObj, item) => {
      //   preObj[item.key] = {};
      //   return preObj;
      // }, {});

      // Object.keys(values).forEach((key) => {
      //   const [keyId, keyName] = key.split('-');
      //   if (!keyMap[keyId]) {
      //     keyMap[keyId] = {};
      //   }
      //   if (keyName === 'clusterSelector') {
      //     keyMap[keyId][keyName] = { name: values[key] };
      //   } else {
      //     keyMap[keyId][keyName] = values[key];
      //   }
      // });
      // allValues = Object.keys(keyMap).map((key) => keyMap[key]);
      return allValues;
    }
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
                itemLength={structList.length}
              />
            ))}
          </Form>
        </div>
        <div className="struct-plan-option">
          <If condition={parameterGroupOption.length === 0}>
            <Button onClick={this.addStructPlanItem} type="secondary">
              {' '}
              Add
            </Button>
          </If>
          <If condition={parameterGroupOption.length > 0}>
            <SplitButton label=" Add" className="workflow-more" type="secondary" autoWidth={false}>
              {parameterGroupOption?.map((item, i) => (
                <SplitButton.Item key={item.join(',')} onClick={() => this.addStructPlanItem(item)}>
                  {item.join(':')}
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
