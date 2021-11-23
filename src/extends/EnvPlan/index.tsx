import React from 'react';
import { Input, Button, Field, Icon, Select, Form, Grid } from '@b-design/ui';
import { If } from 'tsx-control-statements/components';
import './index.less';
import { EnvBinding } from '../../interface/application';
import Translation from '../../components/Translation';
import { checkName } from '../../utils/common';
import { DeliveryTarget } from '../../interface/deliveryTarget';
import { string } from 'prop-types';

const { Col, Row } = Grid;

type Props = {
  value: Array<EnvBinding>;
  targetList?: Array<DeliveryTarget>;
  envList?: Array<EnvBinding>;
};

type State = {
  envList: Array<any>;
};

type EnvItemType = {
  name: string;
  alias: string;
  targetNames: [];
  description?: string;
};

type EnvPlanParams = {
  key: string;
  id: string;
  itemLength: number;
  init: any;
  value?: EnvBinding;
  targetList: Array<{ label: string; value: string }>;
  onChange?: () => {};
  delete?: (key: string) => void;
};
const ENVPLAN_KEY_LIST = ['name', 'alias', 'targetNames', 'description'];
function EnvItem(props: EnvPlanParams) {
  return (
    <div className="env-item-container">
      <Row>
        <Col span={3} style={{ padding: '0 8px' }}>
          <Form.Item required label={<Translation>Name</Translation>}>
            <Input
              {...props.init(`${props.id}-name`, {
                initValue: props.value?.name,
                rules: [
                  {
                    required: true,
                    message: 'Enter Env name',
                  },
                  {
                    required: true,
                    pattern: checkName,
                    message: 'Please enter a valid envbing name',
                  },
                ],
              })}
            />
          </Form.Item>
        </Col>
        <Col span={4} style={{ padding: '0 8px' }}>
          <Form.Item label={<Translation>Alias</Translation>}>
            <Input
              {...props.init(`${props.id}-alias`, {
                initValue: props.value?.alias,
                rules: [
                  {
                    max: 64,
                    message: 'Enter a description less than 64 characters.',
                  },
                ],
              })}
            />
          </Form.Item>
        </Col>
        <Col span={10} style={{ padding: '0 8px' }}>
          <Form.Item required label={<Translation>Target Names</Translation>}>
            <Select
              className="select"
              mode="multiple"
              {...props.init(`${props.id}-targetNames`, {
                initValue: props.value?.targetNames && props.value?.targetNames,
                rules: [
                  {
                    required: true,
                    message: 'Please chose',
                  },
                ],
              })}
              dataSource={props.targetList}
            />
          </Form.Item>
        </Col>
        <Col span={6} style={{ padding: '0 8px' }}>
          <Form.Item label={<Translation>Description</Translation>}>
            <Input
              {...props.init(`${props.id}-description`, {
                initValue: props.value?.description,
                rules: [
                  {
                    max: 128,
                    message: 'Enter a description less than 128 characters.',
                  },
                ],
              })}
            />
          </Form.Item>
        </Col>
        <Col span={1} style={{ padding: '0 8px', display: 'flex', alignItems: 'center' }}>
          <If condition={props.itemLength !== 1}>
            <Icon
              type="ashbin"
              onClick={() => {
                props.delete && props.delete(props.id);
              }}
            />
          </If>
        </Col>
      </Row>
    </div>
  );
}

class EnvPlan extends React.Component<Props, State> {
  field: any;
  constructor(props: Props) {
    super(props);
    let initValues: any[] = [];
    if (props.value && props.value.length > 0) {
      props.value.map((item) => {
        initValues.push({ key: Date.now().toString(), value: item });
      });
    } else {
      initValues.push({ key: Date.now().toString(), value: { name: 'dev', alias: '开发环境' } });
    }
    this.state = {
      envList: initValues,
    };
    this.field = new Field(this);
  }

  componentDidMount = async () => {};

  addEnvPlanItem = () => {
    this.field.validate((error: any) => {
      if (error) {
        console.log(error);
        return;
      }
      const { envList } = this.state;
      const key = Date.now().toString();
      envList.push({
        key,
      });
      this.setState({
        envList,
      });
    });
  };

  removeEnvPlanItem = (key: string) => {
    const { envList } = this.state;
    envList.forEach((item, i) => {
      // 数据移除
      if (item.key === key) {
        envList.splice(i, 1);
      }
    });
    ENVPLAN_KEY_LIST.forEach((_key) => {
      // 移除表单校验
      this.field.remove(`${key}-${_key}`);
    });
    this.setState({
      envList,
    });
  };

  getValues = (): Array<EnvItemType> | null => {
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
      let allValues: Array<EnvItemType> = [];
      const values = this.field.getValues();
      const { envList } = this.state;
      const keyMap = envList.reduce((preObj, item) => {
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
    const { envList } = this.state;
    const { targetList } = this.props;
    const dataSource = (targetList || []).map((item: DeliveryTarget) => ({
      value: item.name,
      label: item.alias || item.name,
    }));
    const { init } = this.field;
    return (
      <div className="env-plan-container">
        <div className="env-plan-group">
          <Form field={this.field}>
            {envList.map((env) => (
              <EnvItem
                delete={this.removeEnvPlanItem}
                id={env.key}
                key={env.key}
                init={init}
                value={env.value}
                itemLength={envList.length}
                targetList={dataSource}
              />
            ))}
          </Form>
        </div>
        <div className="env-plan-option">
          <Button onClick={this.addEnvPlanItem} type="secondary">
            添加环境规划
          </Button>
        </div>
      </div>
    );
  }
}

export default EnvPlan;
