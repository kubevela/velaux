import React, { Component } from 'react';
import { Dialog, Dropdown, Icon, Input, Menu, Form, Field, Message } from '@b-design/ui';
import { If } from 'tsx-control-statements/components';
import WorkFlowItem from '../workflow-item';
import { checkName } from '../../../utils/common';
import { WorkFlowData } from '../entity';
import './index.less';

type Props = {
  dispatch: ({}) => {};
  key: string;
  data: WorkFlowData;
};

type State = {
  errorFocus: boolean;
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
      },
    });
  };

  deleteWorkflow = (name: string) => {
    Dialog.confirm({
      content: `确定删除${name}?`,
      onOk: () => {
        this.props.dispatch({
          type: 'workflow/removeWorkflow',
          payload: {
            name,
          },
        });
      },
    });
  };

  setWorkflowState = (name: string, enable: boolean) => {};

  saveWorkflow = (name: string) => {
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
      const { name, alias, description } = values;
      data.name = name;
      data.alias = alias;
      data.description = description;
      data.data = workflowData;
      this.props.dispatch({
        type: 'workflow/saveWorkflow',
        payload: data,
      });
    });
  };

  render() {
    const { data } = this.props;
    const { errorFocus } = this.state;
    const menu = (
      <Menu>
        <Menu.Item>查看历史记录</Menu.Item>
        <Menu.Item>设置为默认</Menu.Item>
        <If condition={data.option.enable}>
          <Menu.Item
            onClick={() => {
              this.setWorkflowState(data.name, false);
            }}
          >
            禁用
          </Menu.Item>
        </If>
        <If condition={!data.option.enable}>
          <Menu.Item
            onClick={() => {
              this.setWorkflowState(data.name, true);
            }}
          >
            启用
          </Menu.Item>
        </If>
        <Menu.Item onClick={() => this.deleteWorkflow(data.name)}>删除</Menu.Item>
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
            <If condition={!data.option.edit}>
              <div className="workflow-title">{data.alias || data.name}</div>
              <div className="workflow-description">{data.description}</div>
            </If>
            <If condition={data.option.edit}>
              <div className="workflow-description">
                <Form field={this.field} inline>
                  <Form.Item required label="工作流名称">
                    <Input
                      className="input"
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
                  <Form.Item label="工作流别名">
                    <Input className="input" {...init('alias', { initValue: data.alias })} />
                  </Form.Item>
                  <Form.Item label="描述">
                    <Input
                      className="input"
                      {...init('description', { initValue: data.description })}
                    />
                  </Form.Item>
                </Form>
              </div>
            </If>
          </div>
          <div className="workflow-component-tips-container">
            <If condition={!data.option.edit}>
              <div
                className="option-item"
                onClick={() => {
                  this.setEditView(data.name, true);
                }}
              >
                编辑
              </div>
            </If>
            <If condition={data.option.edit}>
              <div
                className="option-item"
                onClick={() => {
                  this.saveWorkflow(data.name);
                }}
              >
                保存
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
            ref={(ref) => (this.workflowItem = ref)}
            data={data.data}
            workflowId={data.appName}
            edit={data.option.edit}
          />
        </div>
      </div>
    );
  }
}

export default WorkFlowComponent;
