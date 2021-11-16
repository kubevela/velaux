import React from 'react';
import { Form, Icon, Field, Button, SplitButton } from '@b-design/ui';
import { If } from 'tsx-control-statements/components';
import { UIParam, GroupOption } from '../../interface/application';
import UISchema from '../../components/UISchema';
import './index.less';

type Props = {
  _key?: string;
  parameterGroupOption: GroupOption[] | undefined;
  param: Array<UIParam> | undefined;
  onChange?: (params: any) => void;
  value: any;
};

type State = {
  structList: Array<any>;
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
  if (option && option.length > 0) {
    const paramMap =
      param &&
      param.reduce((pre: any, next) => {
        pre[next.jsonKey] = next;
        return pre;
      }, {});
    uiSchemas = option.map((key: string) => paramMap[key]);
  }

  const ref: React.RefObject<UISchema> = React.createRef();

  return (
    <div className="struct-item-container">
      <div className="struct-item-content">
        <UISchema ref={ref} uiSchema={uiSchemas} inline _key={id} {...init(`struct${id}`)} />
      </div>
      <div className="remove-option-container">
        <Icon
          type="ashbin"
          onClick={() => {
            props.delete && props.delete(props.id);
          }}
        />
      </div>
    </div>
  );
}

class Structs extends React.Component<Props, State> {
  field: any;
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

  componentDidMount = async () => {};

  setValues = () => {
    const values = this.field.getValues();
    const { onChange } = this.props;
    const result = Object.keys(values).map((key) => {
      return values[key];
    });
    onChange && onChange(result);
  };

  validate = (callback: (error?: string) => void) => {
    this.field.validate((errors: any, values: any) => {
      if (errors) {
        callback('structs validate failure');
        return;
      }
      callback();
    });
  };

  addStructPlanItem = (option?: GroupOption) => {
    this.field.validate((error: any) => {
      if (error) {
        return;
      }
      const { structList } = this.state;
      const key = Date.now().toString();
      if (key) {
        structList.push({
          key,
          option: option?.keys,
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
              {parameterGroupOption?.map((item, i) => (
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
