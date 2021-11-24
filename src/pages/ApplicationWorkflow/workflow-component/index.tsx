import React, { Component } from 'react';
import { Dialog, Dropdown, Icon, Input, Menu, Form, Field, Message } from '@b-design/ui';
import { If } from 'tsx-control-statements/components';
import WorkFlowItem from '../workflow-item';
import { checkName } from '../../../utils/common';
import type { WorkFlowData, WorkFlowOption } from '../entity';
import { deleteWorkFlow } from '../../../api/workflows';
import Translation from '../../../components/Translation';
import './index.less';

type Props = {
  getWorkflow: () => void;
  dispatch: ({}) => {};
  key: string;
  appName: string;
  data: WorkFlowData;
  workFlowDefinitions: [];
};

type State = {
  errorFocus: boolean;
};

type NodeItem = {
  consumerData: {
    alias?: string;
    dependsOn?: null;
    description?: string;
    name: string;
    properties: string;
    type: string;
  };
  diagramMakerData: {};
  id: string;
  typeId: string;
};

class WorkFlowComponent extends Component<Props, State> {
  field;
  workflowItem: any;
  constructor(props: any) {
    super(props);

    this.state = {
      errorFocus: false,
    };
    this.field = new Field(this);
  }

  componentDidMount() {}

  setEditView = (name: string, edit: boolean) => {
    this.props.dispatch({
      type: 'workflow/setEditView',
      payload: {
        name,
        edit,
        workFlowDefinitions: this.props.workFlowDefinitions,
      },
    });
  };

  deleteWorkflow = (name: string) => {
    Dialog.confirm({
      content: `确定删除${name}?`,
      onOk: () => {
        deleteWorkFlow({ name: name, appName: this.props.appName || '' }).then((re) => {
          if (re) {
            Message.success('delete success');
            this.props.getWorkflow();
          }
        });
      },
    });
  };

  setWorkflowState = () => {};

  saveWorkflow = () => {
    this.setState({
      errorFocus: false,
    });
    this.field.validate((error, values: any) => {
      if (error) {
        return;
      }
      const { data } = this.props;
      const workflowData = this.workflowItem.getValues();
      const { nodes } = workflowData;
      if (nodes && Object.keys(nodes).length === 0) {
        Message.error('plase add workflow item');
        this.setState({
          errorFocus: true,
        });
        return;
      }

      const nodeArr: NodeItem[] = Object.values(nodes);
      const find = nodeArr.find((item) => !item.consumerData);

      if (find) {
        return Message.error('please enter node name and enter node type');
      }
      const { name, alias, description } = values;
      data.appName = data.appName || this.props.appName;
      data.name = name;
      data.alias = alias;
      data.description = description;
      data.data = workflowData;
      this.props.dispatch({
        type: 'workflow/saveWorkflow',
        payload: data,
        callback: () => {
          Message.success('save workflow success');
          this.props.getWorkflow();
        },
      });
    });
  };

  render() {
    const { data, workFlowDefinitions } = this.props;
    const { errorFocus } = this.state;
    const option: WorkFlowOption = data.option || { default: true, edit: true, enable: true };
    const menu = (
      <Menu>
        <Menu.Item>
          <Translation>View history</Translation>
        </Menu.Item>
        <Menu.Item>
          <Translation>Set as default</Translation>
        </Menu.Item>
        <Menu.Item onClick={() => this.deleteWorkflow(data.name)}>
          <Translation>Remove</Translation>
        </Menu.Item>
      </Menu>
    );
    const { init } = this.field;
    return (
      <div
        className={
          errorFocus ? 'workflow-component-container error' : 'workflow-component-container'
        }
        id={data.name}
      >
        <div className="workflow-component-title-container">
          <div className="workflow-component-title-content">
            <If condition={!option.edit}>
              <div className="workflow-title">{data.alias || data.name}</div>
              <div className="workflow-description">{data.description}</div>
            </If>
            <If condition={option.edit}>
              <div className="workflow-description">
                <Form field={this.field} inline>
                  <Form.Item required label={<Translation>Workflow Name</Translation>}>
                    <Input
                      {...init('name', {
                        initValue: data.name,
                        rules: [
                          {
                            required: true,
                            pattern: checkName,
                            message: 'Please enter a valid workflow name',
                          },
                        ],
                      })}
                    />
                  </Form.Item>
                  <Form.Item label={<Translation>Workflow Alias</Translation>}>
                    <Input {...init('alias', { initValue: data.alias })} />
                  </Form.Item>
                  <Form.Item label="描述">
                    <Input {...init('description', { initValue: data.description })} />
                  </Form.Item>
                </Form>
              </div>
            </If>
          </div>
          <div className="workflow-component-tips-container">
            <If condition={!option.edit}>
              <div
                className="option-item"
                onClick={() => {
                  this.setEditView(data.name, true);
                }}
              >
                <Translation>Edit</Translation>
              </div>
            </If>
            <If condition={option.edit}>
              <div
                className="option-item"
                onClick={() => {
                  this.saveWorkflow();
                }}
              >
                <Translation>Save</Translation>
              </div>
            </If>
            <div className="option-item">
              <Dropdown
                trigger={<Icon type="ellipsis" className="options-icon" />}
                triggerType={['click']}
                className="workflow-more"
              >
                {menu}
              </Dropdown>
            </div>
          </div>
        </div>
        <div className="workflow-detail-container">
          <WorkFlowItem
            key={data.name + data.appName}
            ref={(ref) => (this.workflowItem = ref)}
            data={data.data || { nodes: {}, edges: {} }}
            workflowId={data.appName + data.name || ''}
            workFlowDefinitions={workFlowDefinitions}
            edit={option.edit}
          />
        </div>
      </div>
    );
  }
}

export default WorkFlowComponent;
