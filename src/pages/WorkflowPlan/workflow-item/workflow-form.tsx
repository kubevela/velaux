import React, { Component } from 'react';
import _ from 'lodash';
import { Form, Field, Input, Button } from '@b-design/ui';
import { DiagramMakerNode } from 'diagram-maker';
import Group from '../../../extends/Group';
import { WorkFlowNodeType } from '../entity';
import './index.less';

type Props = {
    createOrUpdateNode: (data: any) => void;
    data: DiagramMakerNode<WorkFlowNodeType>;
};

type State = {

};

class WorkflowForm extends Component<Props, State> {
    field;

    constructor(props: any) {
        super(props);
        this.field = new Field(this);
    }

    componentDidMount = () => {
        const { consumerData } = this.props.data;
        this.field.setValues(consumerData);
    }

    submit = () => {
        this.field.validate((error, values) => {
            if (error) {
                return;
            }
            this.props.createOrUpdateNode(values);
        })
    }

    setValues = (values: any | null) => {
        if (values) {
            const { consumerData } = values;
            this.field.setValues(consumerData);
        }
    }

    render() {
        const { init } = this.field;
        return (
            <div className="workflow-form-container">
                <div className="form-content">
                    <Form field={this.field} >
                        <Group title="节点基本信息" description="">
                            <Form.Item label="节点名称" required>
                                <Input {...init('name', {
                                    rules: [{
                                        required: true,

                                    }]
                                })} />
                            </Form.Item>
                            <Form.Item label="节点类型" required>
                                <Input {...init('type')} />
                            </Form.Item>
                            <Form.Item label="节点别名">
                                <Input {...init('alias')} />
                            </Form.Item>
                            <Form.Item label="节点描述">
                                <Input {...init('description')} />
                            </Form.Item>
                        </Group>
                        {/* <Group title="节点关系" description="">
                            <Form.Item label="节点依赖" required>

                                <Input {...init('dependsOn')} />
                            </Form.Item>
                            <Form.Item label="节点输入" required>
                                <Input {...init('inputs')} />
                            </Form.Item>
                            <Form.Item label="节点输出">
                                <Input {...init('alias')} />
                            </Form.Item>
                        </Group> */}
                        <Group title="节点属性" description="">

                        </Group>
                    </Form>
                </div>
                <div className="workflow-form-bottom">
                    <Button type="primary" onClick={this.submit}>确定</Button>
                </div>
            </div>
        );
    }
}

export default WorkflowForm;
