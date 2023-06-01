import { Balloon, Card, Dialog, Field, Form, Grid, Input } from '@alifd/next';
import _ from 'lodash';
import React from 'react';

import i18n from '../../i18n';
import type { DefinitionBase , WorkflowStepBase } from '@velaux/data';
import { checkName, showAlias } from '../../utils/common';
import { locale } from '../../utils/locale';
import Item from '../Item';
import { Translation } from '../Translation';

import { StepTypeIcon } from './step-icon';

import './index.less';
import type { Rule } from '@alifd/next/lib/field';

const { Row, Col } = Grid;

interface DefinitionCategory {
  title: string;
  sort: number;
  description?: string;
  definitions: DefinitionBase[];
}

const defaultCategory: Record<string, DefinitionCategory> = {
  'Application Delivery': {
    title: 'Application Delivery',
    description: 'Delivery the Application or workloads to the Targets.',
    definitions: [],
    sort: 2,
  },
  'Resource Management': {
    title: 'Resource Management',
    description: 'Steps for Resource Management',
    definitions: [],
    sort: 3,
  },
  Terraform: {
    title: 'Terraform',
    description: 'Terraform workflow steps',
    definitions: [],
    sort: 4,
  },
  'Config Management': {
    title: 'Config Management',
    description: 'Create or read the config.',
    definitions: [],
    sort: 5,
  },
  'CI Integration': {
    title: 'CI Integration',
    description: 'CI integration steps',
    definitions: [],
    sort: 6,
  },
  'External Integration': {
    title: 'External Integration',
    description: 'External Integration steps',
    definitions: [],
    sort: 7,
  },
  'Process Control': {
    title: 'Process Control',
    description: 'Process Control steps',
    definitions: [],
    sort: 1,
  },
  'Scripts & Commands': {
    title: 'Scripts & Commands',
    description: 'Steps for executing Scripts & Commands',
    definitions: [],
    sort: 8,
  },
  Custom: {
    title: 'Custom',
    description: 'Custom Workflow or Pipeline steps',
    definitions: [],
    sort: 1000,
  },
};

const initDefinitionCategory = (defs: DefinitionBase[]) => {
  return defs.map((def) => {
    if (!def.category || def.category == '') {
      def.category = 'Custom';
    }
    return def;
  });
};

const buildDefinitionCategory = (defs: DefinitionBase[]) => {
  const customDefs = initDefinitionCategory(defs);
  const categoryMap: Record<string, DefinitionCategory> = _.cloneDeep(defaultCategory);
  customDefs.map((def) => {
    const category = def.category;
    if (!category) {
      return;
    }
    if (categoryMap[category]) {
      categoryMap[category].definitions.push(def);
    } else {
      categoryMap[category] = { title: category, definitions: [def], sort: 100 };
    }
  });
  return Object.values(categoryMap).sort((a, b) => {
    return a.sort - b.sort;
  });
};

type Props = {
  definitions?: DefinitionBase[];
  onClose: () => void;
  checkStepName: (name: string) => boolean;
  addStep: (s: WorkflowStepBase) => void;
  addSub?: boolean;
};
type State = {
  selectType?: DefinitionBase;
};

class TypeSelect extends React.Component<Props, State> {
  field = new Field(this);
  constructor(props: Props) {
    super(props);
    this.state = {};
  }
  onSubmit = () => {
    const { selectType } = this.state;
    this.field.validate((error, values: any) => {
      if (error) {
        return;
      }
      if (!selectType) {
        return;
      }
      const { name, alias, description } = values;
      this.props.addStep({
        type: selectType.name,
        name: name,
        alias: alias,
        description: description,
      });
    });
  };

  render() {
    const { definitions, onClose, checkStepName, addSub } = this.props;
    const { selectType } = this.state;
    const categories = buildDefinitionCategory(definitions?.filter((def) => !addSub || def.name != 'step-group') || []);
    const { init } = this.field;
    const checkStepNameRule = (rule: Rule, value: any, callback: (error?: string) => void) => {
      if (checkStepName(value)) {
        callback('Name is used.');
        return;
      }
      callback();
    };
    return (
      <Dialog
        locale={locale().Dialog}
        autoFocus={true}
        overflowScroll={true}
        onClose={onClose}
        onCancel={onClose}
        width={800}
        onOk={this.onSubmit}
        title={selectType ? i18n.t('Set Step Basic Info').toString() : i18n.t('Select Step Type').toString()}
        visible
        v2
      >
        <div>
          {!selectType &&
            categories
              .filter((c) => c.definitions.length > 0)
              .map((category) => {
                return (
                  <Card
                    title={category.title}
                    contentHeight={'auto'}
                    key={category.title}
                    subTitle={category.description}
                  >
                    <div className="def-items">
                      {category.definitions?.map((def) => {
                        const item = (
                          <div key={def.name} className="def-item">
                            <div
                              className="icon"
                              onClick={() => {
                                this.setState({ selectType: def });
                              }}
                            >
                              <StepTypeIcon type={def.name} />
                            </div>
                            <div className="name">{showAlias(def.name, def.alias)}</div>
                          </div>
                        );
                        if (def.description) {
                          return (
                            <Balloon key={def.name + 'balloon'} trigger={item}>
                              {def.description}
                            </Balloon>
                          );
                        }
                        return item;
                      })}
                    </div>
                  </Card>
                );
              })}
          {selectType && (
            <Form field={this.field}>
              <Row wrap>
                <Col span={24}>
                  <Item label={i18n.t('Select Type')} value={showAlias(selectType.name, selectType.alias)} />
                </Col>
                <Col span={24}>
                  <Item label={i18n.t('Type Description')} value={selectType.description} />
                </Col>
              </Row>
              <Row>
                <Col span={12} style={{ padding: '0 8px' }}>
                  <Form.Item label={<Translation>Name</Translation>} labelTextAlign="left" required={true}>
                    <Input
                      htmlType="name"
                      name="name"
                      maxLength={32}
                      {...init('name', {
                        rules: [
                          {
                            required: true,
                            pattern: checkName,
                            message: 'Please enter a valid workflow step name',
                          },
                          {
                            validator: checkStepNameRule,
                          },
                        ],
                      })}
                    />
                  </Form.Item>
                </Col>

                <Col span={12} style={{ padding: '0 8px' }}>
                  <Form.Item label={<Translation>Alias</Translation>}>
                    <Input
                      name="alias"
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
                  </Form.Item>
                </Col>
              </Row>

              <Row>
                <Col span={24} style={{ padding: '0 8px' }}>
                  <Form.Item label={<Translation>Description</Translation>}>
                    <Input
                      name="description"
                      {...init('description', {
                        rules: [
                          {
                            maxLength: 256,
                            message: 'Enter a description that contains less than 256 characters.',
                          },
                        ],
                      })}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          )}
        </div>
      </Dialog>
    );
  }
}

export default TypeSelect;
