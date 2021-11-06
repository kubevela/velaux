import React from 'react';
import { Input, Button, Field, Icon, Select, Form } from '@b-design/ui';
import { If } from 'tsx-control-statements/components';
import './index.less';

type Props = {};

type State = {
  LabelList: Array<any>;
};

type LabelPlanType = {
  key: string;
  value?: string;
  id: string;
  itemLength: number;
  init: any;
  onChange?: () => {};
  delete?: (key: string) => void;
};

type LabelPlanParams = {
  key: string;
  id: string;
  itemLength: number;
  init: any;
  onChange?: () => {};
  delete?: (key: string) => void;
};

function LabelItem(props: LabelPlanParams) {
  return (
    <div className="label-item-container">
      <div className="label-item-content">
        <div className="label-item-form-container">
          <Form.Item label="key">
            <Input
              {...props.init(`${props.id}-key`, {
                rules: [],
              })}
            />
          </Form.Item>
        </div>

        <div className="label-item-form-container">
          <Form.Item label="value">
            <Input
              {...props.init(`${props.id}-value`, {
                rules: [],
              })}
            />
          </Form.Item>
        </div>
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

class LabelPlan extends React.Component<Props, State> {
  field: any;
  constructor(props: Props) {
    super(props);
    this.state = {
      LabelList: [
        {
          key: Date.now().toString(),
        },
      ],
    };
    this.field = new Field(this);
  }

  componentDidMount = async () => {};

  addLabelPlanItem = () => {
    this.field.validate((error: any) => {
      if (error) {
        return;
      }
      const { LabelList } = this.state;
      const key = Date.now().toString();
      LabelList.push({
        key,
      });
      this.setState({
        LabelList,
      });
    });
  };

  removeLabelPlanItem = (key: string) => {
    const { LabelList } = this.state;
    LabelList.forEach((item, i) => {
      if (item.key === key) {
        LabelList.splice(i, 1);
      }
    });
    this.setState({
      LabelList,
    });
  };

  getValues = (): Array<LabelPlanType> | null => {
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
      let allValues: Array<LabelPlanType> = [];
      const values = this.field.getValues();
      const { LabelList } = this.state;
      const keyMap = LabelList.reduce((preObj, item) => {
        preObj[item.key] = {};
        return preObj;
      }, {});

      Object.keys(values).forEach((key) => {
        const [keyId, keyName] = key.split('-');
        if (!keyMap[keyId]) {
          keyMap[keyId] = {};
        }
        keyMap[keyId][keyName] = values[key];
      });
      allValues = Object.keys(keyMap).map((key) => keyMap[key]);
      return allValues;
    }
  };

  render() {
    const { LabelList } = this.state;

    const { init } = this.field;
    return (
      <div className="label-plan-container">
        <div className="label-plan-group">
          <Form field={this.field}>
            {LabelList.map((label) => (
              <LabelItem
                delete={this.removeLabelPlanItem}
                id={label.key}
                key={label.key}
                init={init}
                itemLength={LabelList.length}
              />
            ))}
          </Form>
        </div>
        <div className="label-plan-option">
          <Button onClick={this.addLabelPlanItem} type="secondary">
            增加Label
          </Button>
        </div>
      </div>
    );
  }
}

export default LabelPlan;
