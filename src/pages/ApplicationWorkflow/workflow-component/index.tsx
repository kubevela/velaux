import React, { Component } from 'react';
import _ from 'lodash';
import {
  Dialog,
  Dropdown,
  Icon,
  Input,
  Menu,
  Form,
  Field,
  Message,
  Grid,
  Loading,
} from '@b-design/ui';
import { If } from 'tsx-control-statements/components';
import WorkFlowItem from '../workflow-item';
import { checkName } from '../../../utils/common';
import type { WorkFlowData, WorkFlowOption } from '../entity';
import { deleteWorkFlow } from '../../../api/workflows';
import Translation from '../../../components/Translation';
import './index.less';
import { convertWorkflowStep } from '../../../model/workflow';

const { Col, Row } = Grid;

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
  loading: boolean;
};

export type NodeItem = {
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
      loading: false,
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
      content: `Are you sure delete this workflow?`,
      onOk: () => {
        deleteWorkFlow({ name: name, appName: this.props.appName || '' }).then((re) => {
          if (re) {
            Message.success('delete workflow success');
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
        return Message.error('please enter workflow step name and type');
      }
      this.setState({ loading: true });
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
          this.setState({ loading: false });
        },
      });
    });
  };

  changeDefault = (name: string, isDefault: boolean) => {
    this.props.dispatch({
      type: 'workflow/setDefaultView',
      payload: {
        name,
        isDefault,
      },
    });
  };

  render() {
    const { data, workFlowDefinitions } = this.props;
    const { errorFocus, loading } = this.state;
    const option: WorkFlowOption = data.option || { default: false, edit: false };
    const menu = (
      <Menu>
        <If condition={option.edit}>
          <Menu.Item onClick={() => this.changeDefault(data.name, !option.default)}>
            <Translation>{option.default ? 'Cancel Default' : 'Set As Default'}</Translation>
          </Menu.Item>
        </If>
        <Menu.Item onClick={() => this.deleteWorkflow(data.name)}>
          <Translation>Remove</Translation>
        </Menu.Item>
      </Menu>
    );
    const { init } = this.field;
    const newData = _.cloneDeep(data);
    convertWorkflowStep(newData, data.appName, option.edit ? 250 : 32);
    const workflowData = newData.data || { nodes: {}, edges: {} };
    return (
      <Loading visible={loading} style={{ width: '100%' }}>
        <div
          className={
            errorFocus ? 'workflow-component-container error' : 'workflow-component-container'
          }
          id={data.name}
        >
          <div className="workflow-component-title-container">
            <div className="workflow-component-title-content">
              <If condition={!option.edit}>
                <div className="workflow-title">
                  {data.alias || data.name}
                  {data.option?.default && '(Default)'}
                </div>
                <div className="workflow-description">{data.description}</div>
              </If>
              <If condition={option.edit}>
                <div className="workflow-description">
                  <Form field={this.field} inline>
                    <Row>
                      <Col span={6}>
                        <Form.Item
                          labelAlign="left"
                          disabled
                          required
                          label={<Translation>Name</Translation>}
                        >
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
                      </Col>
                      <Col span={6}>
                        <Form.Item labelAlign="left" label={<Translation>Alias</Translation>}>
                          <Input {...init('alias', { initValue: data.alias })} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item labelAlign="left" label={<Translation>Description</Translation>}>
                          <Input {...init('description', { initValue: data.description })} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form>
                </div>
              </If>
            </div>
            <div className="workflow-component-tips-container">
              <If condition={!option.edit}>
                <a
                  className="option-item"
                  onClick={() => {
                    this.setEditView(data.name, true);
                  }}
                >
                  <Translation>Edit</Translation>
                </a>
              </If>
              <If condition={option.edit}>
                <a
                  className="option-item"
                  onClick={() => {
                    this.setEditView(data.name, false);
                  }}
                >
                  <Translation>Cancel</Translation>
                </a>
                <a
                  className="option-item"
                  onClick={() => {
                    this.saveWorkflow();
                  }}
                >
                  <Translation>Save</Translation>
                </a>
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
              key={data.name + data.appName + option.edit}
              ref={(ref) => (this.workflowItem = ref)}
              data={workflowData}
              workflowId={data.appName + data.name || ''}
              workFlowDefinitions={workFlowDefinitions}
              edit={option.edit}
            />
          </div>
        </div>
      </Loading>
    );
  }
}

export default WorkFlowComponent;
