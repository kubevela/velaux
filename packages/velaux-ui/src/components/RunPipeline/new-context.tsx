import { Field, Loading, Button, Form, Grid, Input } from '@alifd/next';
import React from 'react';

import { createPipelineContext, updatePipelineContext } from '../../api/pipeline';
import KV from '../../extends/KV';
import i18n from '../../i18n';
import type {  PipelineListItem } from '@velaux/data';

import { checkName } from '../../utils/common';
import { Translation } from '../Translation';
import { KeyValue } from "@velaux/data";

const { Row, Col } = Grid;

export interface NewContextProps {
  pipeline: PipelineListItem;
  onSuccess: () => void;
  onCancel: () => void;
  context?: { name: string; values: KeyValue[] };
  clone?: boolean;
}

class NewContext extends React.Component<NewContextProps> {
  field: Field;

  constructor(props: NewContextProps) {
    super(props);
    this.field = new Field(this);
  }
  componentDidMount() {
    const { clone, context } = this.props;
    if (context) {
      const editValues: Record<string, string> = {};
      context.values.map((v) => {
        editValues[v.key] = v.value;
      });
      if (clone) {
        this.field.setValues({
          name: context.name + '-clone',
          values: editValues,
        });
      } else {
        this.field.setValues({
          name: context.name,
          values: editValues,
        });
      }
    }
  }
  submitContext = () => {
    const { context, clone } = this.props;
    const editMode = context && !clone;
    this.field.validate((errs, values: any) => {
      if (errs) {
        return;
      }
      const { project, name } = this.props.pipeline;
      const keyValues: KeyValue[] = [];
      Object.keys(values.values).map((key) => {
        keyValues.push({ key: key, value: values.values[key] });
      });
      if (editMode) {
        updatePipelineContext(project.name, name, { name: values.name, values: keyValues as {key: string, value: string}[] }).then((res) => {
          if (res) {
            this.props.onSuccess();
          }
        });
      } else {
        createPipelineContext(project.name, name, { name: values.name, values: keyValues as {key: string, value: string}[] }).then((res) => {
          if (res) {
            this.props.onSuccess();
          }
        });
      }
    });
  };
  render() {
    const { init } = this.field;
    const { context, clone } = this.props;
    const editMode = context && !clone;
    // waiting init the values
    if (context && Object.keys(this.field.getValues()).length === 0) {
      return <Loading visible />;
    }
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
                disabled={editMode}
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
