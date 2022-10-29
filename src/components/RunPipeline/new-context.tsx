import React from 'react';
import { Field } from '@b-design/ui';
import { Button, Form, Grid, Input } from '@b-design/ui';
import KV from '../../extends/KV';
import i18n from '../../i18n';
import Translation from '../Translation';
import { createPipelineContext } from '../../api/pipeline';
import type { KeyValue, Pipeline } from '../../interface/pipeline';
import { checkName } from '../../utils/common';

const { Row, Col } = Grid;

export interface NewContextProps {
  pipeline: Pipeline;
  onSuccess: () => void;
  onCancel: () => void;
}

class NewContext extends React.Component<NewContextProps> {
  field: Field;

  constructor(props: NewContextProps) {
    super(props);
    this.field = new Field(this);
  }
  submitContext = () => {
    this.field.validate((errs, values: any) => {
      if (errs) {
        return;
      }
      const { project, name } = this.props.pipeline;
      const keyValues: KeyValue[] = [];
      Object.keys(values.values).map((key) => {
        keyValues.push({ key: key, value: values.values[key] });
      });
      createPipelineContext(project.name, name, { name: values.name, values: keyValues }).then(
        (res) => {
          if (res) {
            this.props.onSuccess();
          }
        },
      );
    });
  };
  render() {
    const { init } = this.field;
    return (
      <Form field={this.field} style={{ width: '100%' }}>
        <Row style={{ width: '100%' }} wrap>
          <Col span={24}>
            <Form.Item label="Name" required>
              <Input
                {...init('name', {
                  rules: [
                    {
                      required: true,
                      message: i18n.t('You must input a context name'),
                    },
                    {
                      pattern: checkName,
                      message: i18n.t('You must input a valid name'),
                    },
                  ],
                })}
                placeholder={i18n.t('Please input the context name')}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Values" required>
              <KV
                {...init('values', {
                  rules: [
                    {
                      required: true,
                      message: i18n.t('You must input at least one value'),
                    },
                  ],
                })}
                disabled={false}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <div className="flexcenter">
              <Button type="secondary" onClick={this.submitContext} style={{ marginRight: '16px' }}>
                <Translation>Submit</Translation>
              </Button>
              <Button onClick={this.props.onCancel}>
                <Translation>Cancel</Translation>
              </Button>
            </div>
          </Col>
        </Row>
      </Form>
    );
  }
}

export default NewContext;
