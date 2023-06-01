import type { Field } from '@alifd/next';
import { Grid, Form, Input, Select } from '@alifd/next';
import React from 'react';

import { checkName } from '../../../../utils/common';
import './index.less';
import { Translation } from '../../../../components/Translation';
import i18n from '../../../../i18n';
import type { LoginUserInfo, UserProject } from '@velaux/data';
import { checkPermission } from '../../../../utils/permission';

type Props = {
  visible: boolean;
  field: Field;
  projects?: UserProject[];
  isDisableProject?: boolean;
  userInfo?: LoginUserInfo;
  setVisible: (visible: boolean) => void;
  dispatch: ({}) => void;
};

type State = {};

class GeneralConfig extends React.Component<Props, State> {
  resetField() {
    this.props.field.setValues({
      name: '',
      cluster: [],
      describe: '',
    });
  }

  render() {
    const { Row, Col } = Grid;
    const { projects, isDisableProject, userInfo } = this.props;
    let defaultProject = '';
    const projectOptions: Array<{ label: string; value: string }> = [];
    (projects || []).map((project) => {
      if (
        checkPermission({ resource: `project:${project.name}/application:*`, action: 'create' }, project.name, userInfo)
      ) {
        if (project.name === 'default') {
          defaultProject = project.name;
        }
        projectOptions.push({
          label: project.alias ? `${project.alias}(${project.name})` : project.name,
          value: project.name,
        });
      }
    });
    const FormItem = Form.Item;
    const formItemLayout = {
      labelCol: {
        fixedSpan: 6,
      },
      wrapperCol: {
        span: 20,
      },
    };
    const init = this.props.field.init;

    return (
      <div>
        <Form {...formItemLayout} field={this.props.field}>
          <Row>
            <Col span={12} style={{ padding: '0 8px' }}>
              <FormItem label={<Translation>Name</Translation>} labelTextAlign="left" required={true}>
                <Input
                  name="name"
                  maxLength={31}
                  {...init('name', {
                    rules: [
                      {
                        required: true,
                        pattern: checkName,
                        message: <Translation>Please enter a valid application name</Translation>,
                      },
                    ],
                  })}
                />
              </FormItem>
            </Col>
            <Col span={12} style={{ padding: '0 8px' }}>
              <FormItem label={<Translation>Alias</Translation>}>
                <Input
                  name="alias"
                  placeholder={i18n.t('Give your app a more recognizable name').toString()}
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
            <Col span={24} style={{ padding: '0 8px' }}>
              <FormItem label={<Translation>Description</Translation>}>
                <Input
                  name="description"
                  {...init('description', {
                    rules: [
                      {
                        maxLength: 128,
                        message: 'Enter a description less than 128 characters.',
                      },
                    ],
                  })}
                />
              </FormItem>
            </Col>
          </Row>
          <Row>
            <Col span={24} style={{ padding: '0 8px' }}>
              <FormItem label={<Translation>Project</Translation>} required>
                <Select
                  name="project"
                  placeholder={i18n.t('Please select a project').toString()}
                  disabled={isDisableProject ? true : false}
                  dataSource={projectOptions}
                  filterLocal={true}
                  hasClear={true}
                  style={{ width: '100%' }}
                  {...init('project', {
                    initValue: defaultProject,
                    rules: [
                      {
                        required: true,
                        message: 'Please select project',
                      },
                    ],
                  })}
                />
              </FormItem>
            </Col>
          </Row>
        </Form>
      </div>
    );
  }
}

export default GeneralConfig;
