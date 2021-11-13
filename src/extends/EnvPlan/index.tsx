import React from 'react';
import { Input, Button, Field, Icon, Select, Form } from '@b-design/ui';
import { If } from 'tsx-control-statements/components';
import './index.less';
import { EnvBinding } from '../../interface/application';
import Translation from '../../components/Translation';

type Props = {
  clusterList: Array<any>;
  envList?: Array<EnvBinding>;
};

type State = {
  envList: Array<any>;
};
type ClusterItem = {
  name: string;
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
  clusterList: Array<{ label: string; value: string }>;
  onChange?: () => {};
  delete?: (key: string) => void;
};
const ENVPLAN_KEY_LIST = ['name', 'alias', 'targetNames', 'description'];
function EnvItem(props: EnvPlanParams) {
  return (
    <div className="env-item-container">
      <div className="env-item-content">
        <div className="env-item-form-container">
          <Form.Item required label={<Translation>Name</Translation>}>
            <Input
              {...props.init(`${props.id}-name`, {
                rules: [
                  {
                    required: true,
                    message: 'Enter Env name',
                  },
                ],
              })}
            />
          </Form.Item>
        </div>
        <div className="env-item-form-container">
          <Form.Item required label={<Translation>Alias</Translation>}>
            <Input
              {...props.init(`${props.id}-alias`, {
                rules: [
                  {
                    required: true,
                    message: 'Enter Env alias',
                  },
                ],
              })}
            />
          </Form.Item>
        </div>
        <div className="env-item-form-container">
          <Form.Item required label={<Translation>Target Names</Translation>}>
            <Select
              className="select"
              {...props.init(`${props.id}-targetNames`, {
                rules: [
                  {
                    required: true,
                    message: 'Please chose',
                  },
                ],
              })}
              dataSource={props.clusterList}
            />
          </Form.Item>
        </div>

        <div className="env-item-form-container">
          <Form.Item label={<Translation>Description</Translation>}>
            <Input
              {...props.init(`${props.id}-description`, {
                rules: [
                  {
                    required: false,
                  },
                ],
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

class EnvPlan extends React.Component<Props, State> {
  field: any;
  constructor(props: Props) {
    super(props);
    this.state = {
      envList: [
        {
          key: Date.now().toString(),
        },
      ],
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
        if (keyName === 'targetNames') {
          keyMap[keyId][keyName] = [values[key]];
        } else {
          keyMap[keyId][keyName] = values[key];
        }
      });
      allValues = Object.keys(keyMap).map((key) => keyMap[key]);
      return allValues;
    }
  };

  render() {
    const { envList } = this.state;
    const { clusterList } = this.props;
    const dataSource = (clusterList || []).map((item: { name: string }) => ({
      value: item.name,
      label: item.name,
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
                itemLength={envList.length}
                clusterList={dataSource}
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
