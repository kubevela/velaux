import React from 'react';
import { Input, Button, Field, Icon, Select, Form } from '@b-design/ui';
import { If } from 'tsx-control-statements/components';
import './index.less';

type Props = {
    clusterList: Array<any>;
};

type State = {
    envList: Array<any>;
};
type ClusterItem = {
    name: string;
};
type EnvItemType = {
    namespace: string;
    name: string;
    clusterSelector: ClusterItem;
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

function EnvItem(props: EnvPlanParams) {
    return (
        <div className="env-item-container">
            <div className="env-item-content">
                <div className="env-item-form-container">
                    <Form.Item required label="命名空间">
                        <Input
                            {...props.init(`${props.id}-namespace`, {
                                rules: [
                                    {
                                        required: true,
                                        message: '命名空间必填',
                                    },
                                ],
                            })}
                        />
                    </Form.Item>
                </div>
                <div className="env-item-form-container">
                    <Form.Item required label="环境名称">
                        <Input
                            {...props.init(`${props.id}-name`, {
                                rules: [
                                    {
                                        required: true,
                                        message: '环境名必填',
                                    },
                                ],
                            })}
                        />
                    </Form.Item>
                </div>
                <div className="env-item-form-container">
                    <Form.Item required label="集群">
                        <Select
                            className="select"
                            {...props.init(`${props.id}-clusterSelector`, {
                                rules: [
                                    {
                                        required: true,
                                        message: '请选择集群',
                                    },
                                ],
                            })}
                            dataSource={props.clusterList}
                        />
                    </Form.Item>
                </div>
                <div className="env-item-form-container">
                    <Form.Item label="环境描述">
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

    componentDidMount = async () => { };

    addEnvPlanItem = () => {
        this.field.validate((error: any) => {
            if (error) {
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
            if (item.key === key) {
                const values = this.field.getValues();
                Object.keys(values).forEach((_key) => {
                    if (_key.indexOf(key) !== -1) {
                        this.field.remove(_key);
                    };
                });
                envList.splice(i, 1);
            }
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
                if (keyName === 'clusterSelector') {
                    keyMap[keyId][keyName] = { name: values[key] };
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
