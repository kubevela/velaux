import { Form, Input, Select, Button, Grid, Message, Field } from '@alifd/next';
import React from 'react';

import { createProject } from '../../../../api/project';
import { If } from '../../../../components/If';
import { Translation } from '../../../../components/Translation';
import { checkName } from '../../../../utils/common';
import { locale } from '../../../../utils/locale';

const { Col, Row } = Grid;
const FormItem = Form.Item;
type Props = {
  disable?: boolean;
  formItemLayout?: any;
  projectList?: Array<{ label: string; value: string }>;
  syncProjectList?: () => void;
  field: Field;
  handleSelectNameSpace?: () => {};
  disableNew?: boolean;
};

type State = {
  showProjectInput: boolean;
  inputNamespaceParam: string;
};

class ProjectForm extends React.Component<Props, State> {
  form: Field;
  constructor(props: any) {
    super(props);
    this.state = {
      showProjectInput: false,
      inputNamespaceParam: '',
    };
    this.form = new Field(this);
  }

  openNamespaceInput = () => {
    this.setState({
      showProjectInput: true,
    });
  };

  createProject = () => {
    this.form.validate((errors: any, values: any) => {
      if (errors) {
        return;
      }
      createProject({ name: values.project_name, alias: values.project_alias }).then((re) => {
        if (re) {
          Message.success('create project success');
          if (this.props.syncProjectList) {
            this.props.syncProjectList();
          }
          this.setState({
            showProjectInput: false,
          });
        }
      });
    });
  };

  render() {
    const { formItemLayout, projectList, field, disableNew, disable } = this.props;
    const { showProjectInput } = this.state;
    return (
      <React.Fragment>
        <FormItem {...formItemLayout} label={<Translation>Project</Translation>} labelTextAlign="left" required={true}>
          <If condition={!showProjectInput}>
            <div className="cluster-container">
              <Select
                disabled={disable}
                locale={locale().Select}
                className="cluster-params-input"
                mode="single"
                dataSource={projectList}
                {...field.init('project', { initValue: '' })}
                placeholder={''}
              />
              <If condition={!disableNew}>
                <Button
                  className="cluster-option-btn"
                  type="secondary"
                  disabled={disable}
                  onClick={this.openNamespaceInput}
                >
                  <Translation>New</Translation>
                </Button>
              </If>
            </div>
          </If>
          <If condition={showProjectInput}>
            <Form field={this.form}>
              <Row>
                <Col span={8}>
                  <Form.Item labelAlign="inset" label={<Translation>Name</Translation>} required>
                    <Input
                      {...this.form.init('project_name', {
                        rules: [
                          { required: true, message: 'Please enter a valid project name' },
                          { pattern: checkName, message: 'Please enter a valid project name' },
                        ],
                      })}
                    />
                  </Form.Item>
                </Col>
                <Col span={8} style={{ padding: '0 8px' }}>
                  <Form.Item labelAlign="inset" label={<Translation>Alias</Translation>}>
                    <Input
                      {...this.form.init('project_alias', {
                        rules: [{ maxLength: 24, message: 'The project alias max length is 24.' }],
                      })}
                    />
                  </Form.Item>
                </Col>
                <Button className="cluster-option-btn" type="secondary" onClick={this.createProject}>
                  <Translation>Submit</Translation>
                </Button>
                <Button
                  className="cluster-option-btn"
                  type="secondary"
                  style={{ marginLeft: '16px' }}
                  onClick={() => {
                    this.setState({ showProjectInput: false });
                  }}
                >
                  <Translation>Cancel</Translation>
                </Button>
              </Row>
            </Form>
          </If>
        </FormItem>
      </React.Fragment>
    );
  }
}

export default ProjectForm;
