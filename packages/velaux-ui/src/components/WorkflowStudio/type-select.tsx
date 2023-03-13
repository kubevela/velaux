import { Balloon, Card, Dialog, Field, Form, Grid, Input } from '@alifd/next';
import _ from 'lodash';
import React from 'react';

import i18n from '../../i18n';
import type { DefinitionBase } from '../../interface/definitions';
import type { WorkflowStepBase } from '../../interface/pipeline';
import { checkName, showAlias } from '../../utils/common';
import locale from '../../utils/locale';
import Item from '../Item';
import Translation from '../Translation';

import { StepTypeIcon } from './step-icon';

import './index.less';
import type { Rule } from '@alifd/next/lib/field';

const { Row, Col } = Grid;

interface DefinitionCatalog {
  title: string;
  sort: number;
  description?: string;
  definitions: DefinitionBase[];
}

const defaultDefinitionCatalog: Record<string, string> = {
  'step-group': 'Group',
  deploy: 'Delivery',
  'apply-app': 'Delivery',
  'apply-deployment': 'Delivery',
  'apply-component': 'Delivery',
  'addon-operation': 'Delivery',
  'deploy-cloud-resource': 'Delivery',
  'share-cloud-resource': 'Delivery',
  'export-service': 'Delivery',
  notification: 'Notification',
  webhook: 'Notification',
  'create-config': 'Config Management',
  'delete-config': 'Config Management',
  'list-config': 'Config Management',
  'read-config': 'Config Management',
  'export-data': 'Config Management',
  export2config: 'Config Management',
  export2secret: 'Config Management',
  suspend: 'Notification',
};

const defaultCatalog: Record<string, DefinitionCatalog> = {
  Group: {
    title: 'Group',
    description: 'Merge a set of steps.',
    definitions: [],
    sort: 1,
  },
  Delivery: {
    title: 'Delivery',
    description: 'Delivery the Application or workloads to the Targets',
    definitions: [],
    sort: 2,
  },
  Approval: {
    title: 'Approval',
    description: 'Approval or reject the changes during Workflow or Pipeline progress',
    definitions: [],
    sort: 3,
  },
  'Config Management': {
    title: 'Config Management',
    description: 'Create or read the config.',
    definitions: [],
    sort: 4,
  },
  Notification: {
    title: 'Notification',
    description: 'Send messages to users or other applications.',
    definitions: [],
    sort: 5,
  },
  Custom: {
    title: 'Custom',
    description: 'Custom Workflow or Pipeline steps',
    definitions: [],
    sort: 1000,
  },
};

const catalogLabelKey = 'definition.oam.dev/catalog';

const initDefinitionCatalog = (defs: DefinitionBase[]) => {
  return defs.map((def) => {
    if (!def.labels[catalogLabelKey]) {
      const d = defaultDefinitionCatalog[def.name];
      if (def.labels) {
        def.labels[catalogLabelKey] = d ? d : 'Custom';
      } else {
        def.labels = {
          catalogLabelKey: d ? d : 'Custom',
        };
      }
    } else {
      def.labels[catalogLabelKey] = def.labels[catalogLabelKey].replaceAll('_', ' ');
    }
    return def;
  });
};

const buildDefinitionCatalog = (defs: DefinitionBase[]) => {
  const customDefs = initDefinitionCatalog(defs);
  const catalogMap: Record<string, DefinitionCatalog> = _.cloneDeep(defaultCatalog);
  customDefs.map((def) => {
    const catalog = def.labels[catalogLabelKey];
    if (catalogMap[catalog]) {
      catalogMap[catalog].definitions.push(def);
    } else {
      catalogMap[catalog] = { title: catalog, definitions: [def], sort: 100 };
    }
  });
  return Object.values(catalogMap).sort((a, b) => {
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
    const catalogs = buildDefinitionCatalog(definitions?.filter((def) => !addSub || def.name != 'step-group') || []);
    console.log(catalogs);
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
            catalogs
              .filter((c) => c.definitions.length > 0)
              .map((catalog) => {
                return (
                  <Card title={catalog.title} contentHeight={'auto'} key={catalog.title} subTitle={catalog.description}>
                    <div className="def-items">
                      {catalog.definitions?.map((def) => {
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
