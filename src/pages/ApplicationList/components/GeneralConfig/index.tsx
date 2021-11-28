import React from 'react';
import type { Field } from '@b-design/ui';
import { Grid, Form, Input } from '@b-design/ui';
import NameSpaceForm from './namespace-form';
import type EnvPlan from '../../../../extends/EnvPlan';
import { checkName } from '../../../../utils/common';
import './index.less';
import Translation from '../../../../components/Translation';

type Props = {
  visible: boolean;
  field: Field;
  namespaceList?: [];
  setVisible: (visible: boolean) => void;
  t: (key: string) => {};
  dispatch: ({}) => {};
  namespaceChange?: (namespace: string) => void;
};

type State = {};

class GeneralConfig extends React.Component<Props, State> {
  envBind: React.RefObject<EnvPlan>;
  constructor(props: Props) {
    super(props);
    this.envBind = React.createRef();
  }

  resetField() {
    this.props.field.setValues({
      name: '',
      cluster: [],
      describe: '',
    });
  }

  render() {
    const { Row, Col } = Grid;
    const { namespaceList = [] } = this.props;
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
                label={<Translation>Application Name</Translation>}
                labelTextAlign="left"
                required={true}
              >
                <Input
                  htmlType="name"
                  name="name"
                  maxLength={32}
                  {...init('name', {
                    rules: [
                      {
                        required: true,
                        pattern: checkName,
                        message: 'Please enter a valid application name',
                      },
                    ],
                  })}
                />
              </FormItem>
            </Col>
            <Col span={12} style={{ padding: '0 8px' }}>
              <FormItem label={<Translation>Application Alias</Translation>}>
                <Input
                  name="alias"
                  placeholder={'Give your app a more recognizable name'}
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
              <FormItem label={<Translation>Application Description</Translation>}>
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
              <NameSpaceForm
                onChange={this.props.namespaceChange}
                field={this.props.field}
                namespaceList={namespaceList}
                disableNew={true}
              />
            </Col>
          </Row>
        </Form>
      </div>
    );
  }
}

export default GeneralConfig;
