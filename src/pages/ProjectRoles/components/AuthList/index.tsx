import React, { Component } from 'react';
import { Grid, Form, Input, Field, Checkbox, Button } from '@b-design/ui';
import { checkName } from '../../../../utils/common';
import Translation from '../../../../components/Translation';
import i18n from '../../../../i18n';
import './index.less';

type Props = {};
type State = {
  environmentValue: string[];
  applicationValue: string[];
  componentValue: string[];
  workflowValue: string[];
  revisionValue: string[];
};

type CheckBoxBase = { name: string }[];
const { Group: CheckboxGroup } = Checkbox;

class RolesList extends Component<Props, State> {
  field: Field;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.state = {
      environmentValue: [],
      applicationValue: [],
      componentValue: [],
      workflowValue: [],
      revisionValue: [],
    };
  }

  transCheckBoxData = (data: CheckBoxBase) => {
    return (data || []).map((item) => {
      return {
        value: item.name,
        label: item.name,
      };
    });
  };

  listEnvironment = () => {
    const data = [
      { name: '全部' },
      { name: '列表查询' },
      { name: '详情查询' },
      { name: '新增' },
      { name: '断开' },
      { name: '编辑' },
    ];
    return this.transCheckBoxData(data);
  };

  listApplication = () => {
    const data = [
      { name: '全部' },
      { name: '列表查询' },
      { name: '详情查询' },
      { name: '新增' },
      { name: '删除' },
      { name: '环境部署' },
      { name: '环境部署' },
      { name: '环境回收' },
      { name: '绑定环境' },
      { name: '解绑环境' },
    ];
    return this.transCheckBoxData(data);
  };

  listComponent = () => {
    const data = [
      { name: '全部' },
      { name: '列表查询' },
      { name: '详情查询' },
      { name: '新增' },
      { name: '编辑' },
      { name: '删除' },
    ];
    return this.transCheckBoxData(data);
  };

  listWorkFlow = () => {
    const data = [
      { name: '全部' },
      { name: '列表查询' },
      { name: '详情查询' },
      { name: '新增' },
      { name: '编辑' },
      { name: '删除' },
    ];
    return this.transCheckBoxData(data);
  };

  listRevision = () => {
    const data = [{ name: '全部' }, { name: '列表查询' }, { name: '回滚' }];
    return this.transCheckBoxData(data);
  };

  onEnvironmentChange = (selectedItems: string[]) => {
    this.setState({
      environmentValue: selectedItems,
    });
  };

  onApplicationChange = (selectedItems: string[]) => {
    this.setState({
      applicationValue: selectedItems,
    });
  };

  onComponentChange = (selectedItems: string[]) => {
    this.setState({
      componentValue: selectedItems,
    });
  };

  onWorkFlowChange = (selectedItems: string[]) => {
    this.setState({
      workflowValue: selectedItems,
    });
  };

  onRevisionChange = (selectedItems: string[]) => {
    this.setState({
      revisionValue: selectedItems,
    });
  };

  getEnvironmentList = () => {
    const { Row, Col } = Grid;
    const environments = this.listEnvironment();
    return (
      <Row className="padding-left-10  margin-bottom-20">
        <Col span="24">
          <div className="font-weight-400">
            <Translation>环境(Environment)</Translation>
          </div>
          <CheckboxGroup
            value={this.state.environmentValue}
            dataSource={environments}
            onChange={this.onEnvironmentChange}
          />
        </Col>
      </Row>
    );
  };

  getApplicationList = () => {
    const { Row, Col } = Grid;
    const applications = this.listApplication();
    return (
      <Row className="padding-left-10  margin-bottom-20">
        <Col span="24">
          <div className="font-weight-400">
            <Translation>应用(Application)</Translation>
          </div>
          <CheckboxGroup
            value={this.state.applicationValue}
            dataSource={applications}
            onChange={this.onApplicationChange}
          />
        </Col>
      </Row>
    );
  };

  getComponentList = () => {
    const { Row, Col } = Grid;
    const components = this.listComponent();
    return (
      <Row className="padding-left-30 margin-bottom-20">
        <Col span="24">
          <div className="font-weight-400">
            <Translation>组件(Component)</Translation>
          </div>
          <CheckboxGroup
            value={this.state.componentValue}
            dataSource={components}
            onChange={this.onComponentChange}
          />
        </Col>
      </Row>
    );
  };

  getWorkFlowList = () => {
    const { Row, Col } = Grid;
    const workflows = this.listWorkFlow();
    return (
      <Row className="padding-left-30  margin-bottom-20">
        <Col span="24">
          <div className="font-weight-400">
            <Translation>工作流(Workflow)</Translation>
          </div>
          <CheckboxGroup
            value={this.state.workflowValue}
            dataSource={workflows}
            onChange={this.onWorkFlowChange}
          />
        </Col>
      </Row>
    );
  };

  getRevisionList = () => {
    const { Row, Col } = Grid;
    const revisions = this.listRevision();
    return (
      <Row className="padding-left-30  margin-bottom-20">
        <Col span="24">
          <div className="font-weight-400">
            <Translation>版本(Revision)</Translation>
          </div>
          <CheckboxGroup
            value={this.state.revisionValue}
            dataSource={revisions}
            onChange={this.onRevisionChange}
          />
        </Col>
      </Row>
    );
  };

  handleCreate = () => {};

  render() {
    const init = this.field.init;
    const { Row, Col } = Grid;
    const FormItem = Form.Item;
    const formItemLayout = {
      labelCol: {
        fixedSpan: 6,
      },
      wrapperCol: {
        span: 20,
      },
    };
    return (
      <div className="auth-list-wrapper">
        <Form {...formItemLayout} field={this.field} className="auth-form-content">
          <Row>
            <Col span={12} style={{ padding: '16px 16px 0 30px' }}>
              <FormItem
                label={<Translation>Name</Translation>}
                labelAlign="left"
                required={true}
                className="font-weight-400"
              >
                <Input
                  name="name"
                  placeholder={i18n.t('Please enter').toString()}
                  maxLength={32}
                  {...init('name', {
                    rules: [
                      {
                        required: false,
                        pattern: checkName,
                        message: <Translation>Please enter a valid name</Translation>,
                      },
                    ],
                  })}
                />
              </FormItem>
            </Col>
            <Col span={12} style={{ padding: '16px 16px 0 30px' }}>
              <FormItem
                label={<Translation>Alias</Translation>}
                labelAlign="left"
                className="font-weight-400"
              >
                <Input
                  name="alias"
                  placeholder={i18n.t('Please enter').toString()}
                  {...init('alias', {
                    rules: [
                      {
                        minLength: 2,
                        maxLength: 64,
                        message: 'Enter a string of 2 to 64 characters.',
                      },
                    ],
                  })}
                />
              </FormItem>
            </Col>
          </Row>
          <Row>
            <Col span={24} style={{ padding: '0 16px 16px 30px' }}>
              <FormItem
                label={<Translation>Authority</Translation>}
                labelAlign="left"
                className="font-weight-400"
                required={true}
              >
                {this.getEnvironmentList()}
                {this.getApplicationList()}
                {this.getComponentList()}
                {this.getWorkFlowList()}
                {this.getRevisionList()}
                <Button className="create-auth-btn" type="primary" onClick={this.handleCreate}>
                  <Translation>Create</Translation>
                </Button>
              </FormItem>
            </Col>
          </Row>
        </Form>
      </div>
    );
  }
}

export default RolesList;
