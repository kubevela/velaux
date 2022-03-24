import React from 'react';
import type { Field } from '@b-design/ui';
import { Grid, Form, Input, Select } from '@b-design/ui';
import { checkName } from '../../../../utils/common';
import './index.less';
import Translation from '../../../../components/Translation';
import type { Project } from '../../../../interface/project';
import i18n from '../../../../i18n';

type Props = {
  visible: boolean;
  field: Field;
  projects?: Project[];
  isDisableProject?: boolean;
  syncProjectList: () => void;
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
    const { projects, isDisableProject } = this.props;
    const projectList = (projects || []).map((item) => {
      return {
        label: item.name,
        value: item.name,
      };
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
              <FormItem
                label={<Translation>Name</Translation>}
                labelTextAlign="left"
                required={true}
              >
                <Input
                  name="name"
                  maxLength={32}
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
                <Select.AutoComplete
                  name="project"
                  hasClear
                  placeholder={i18n.t('Please select').toString()}
                  filterLocal={true}
                  disabled={isDisableProject ? true : false}
                  dataSource={projectList}
                  style={{ width: '100%' }}
                  {...init('project', {
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
