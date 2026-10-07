import { Balloon, Button, Card, Dialog, Field, Form, Grid, Input, Select, Step } from '@alifd/next';
import _ from 'lodash';
import React from 'react';

import i18n from '../../i18n';
import type { DefinitionBase, WorkflowMode, WorkflowStep, WorkflowStepBase } from '@velaux/data';
import { checkName, showAlias } from '../../utils/common';
import { locale } from '../../utils/locale';
import { isUsable } from '../../utils/restrictions';
import Item from '../Item';
import { Translation } from '../Translation';

import { WorkflowEditContext } from '../../context';
import StepForm from './step-form';
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
  // draft places the step being added in a copy of the workflow, as it would
  // go in, for the Properties stage to offer and pre-fill its dependsOn.
  draft: (step: WorkflowStepBase) => { steps: WorkflowStep[]; step: WorkflowStepBase };
  onAdd: (step: WorkflowStepBase) => void;
  addSub?: boolean;
  // subMode is how a new group's steps run until it is changed here.
  subMode?: WorkflowMode;
};
type State = {
  selectType?: DefinitionBase;
  stage: number;
  details?: { name: string; alias?: string; description?: string };
  groupMode?: WorkflowMode;
};

type Stage = 'type' | 'details' | 'properties';

// AddStep adds a step in stages: its type (unless only one is on offer), its
// name and description, then its properties. Nothing is added until Add, and
// only once every stage is valid; cancelling at any stage adds nothing.
class AddStep extends React.Component<Props, State> {
  field = new Field(this);
  form = React.createRef<StepForm>();
  constructor(props: Props) {
    super(props);
    this.state = { stage: 0 };
  }

  // usable are the types on offer: inside a group, no group.
  usable = () =>
    this.props.definitions?.filter((def) => (!this.props.addSub || def.name != 'step-group') && isUsable(def)) || [];

  // chosen is the picked type, or the only one on offer, which needs no picking.
  chosen = () => {
    const usable = this.usable();
    return this.state.selectType || (usable.length === 1 ? usable[0] : undefined);
  };

  stages = (): Stage[] => (this.usable().length === 1 ? ['details', 'properties'] : ['type', 'details', 'properties']);

  // draftStep is the step as the stages so far describe it.
  draftStep = (): WorkflowStepBase => {
    const type = this.chosen();
    const { details, groupMode } = this.state;
    return {
      type: type?.name || '',
      name: details?.name || '',
      alias: details?.alias,
      description: details?.description,
      ...(type?.name === 'step-group' ? { mode: groupMode || this.props.subMode || 'DAG' } : {}),
    } as WorkflowStepBase;
  };

  next = () => {
    const stage = this.stages()[this.state.stage];
    if (stage === 'type') {
      if (this.chosen()) {
        this.setState({ stage: this.state.stage + 1 });
      }
      return;
    }
    if (stage === 'details') {
      this.field.validate((error, values: any) => {
        if (!error) {
          const { name, alias, description } = values;
          this.setState({ details: { name, alias, description }, stage: this.state.stage + 1 });
        }
      });
    }
  };

  back = () => {
    const stage = this.stages()[this.state.stage];
    if (stage === 'details') {
      // Kept for when the details come back into view.
      this.setState({ details: this.field.getValues() as State['details'] });
    }
    this.setState({ stage: Math.max(0, this.state.stage - 1) });
  };

  add = () => {
    const form = this.form.current;
    if (!form) {
      return;
    }
    form.collect((step) => {
      if (step) {
        const { mode } = this.draftStep() as WorkflowStepBase & { mode?: WorkflowMode };
        this.props.onAdd(mode ? ({ ...step, mode } as WorkflowStepBase) : step);
      }
    });
  };

  renderType = () => {
    const categories = buildDefinitionCategory(this.usable());
    const { selectType } = this.state;
    return categories
      .filter((c) => c.definitions.length > 0)
      .map((category) => (
        <Card title={category.title} contentHeight={'auto'} key={category.title} subTitle={category.description}>
          <div className="def-items">
            {category.definitions?.map((def) => {
              const item = (
                <div key={def.name} className={`def-item ${selectType?.name === def.name ? 'selected' : ''}`}>
                  <div
                    className="icon"
                    onClick={() => {
                      this.setState({ selectType: def, stage: this.state.stage + 1 });
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
      ));
  };

  renderDetails = () => {
    const selectType = this.chosen();
    const { init } = this.field;
    const { details } = this.state;
    const checkStepNameRule = (rule: Rule, value: any, callback: (error?: string) => void) => {
      if (this.props.checkStepName(value)) {
        callback('Name is used.');
        return;
      }
      callback();
    };
    return (
      <Form field={this.field}>
        <Row wrap>
          <Col span={24}>
            <Item label={i18n.t('Type')} value={selectType && showAlias(selectType.name, selectType.alias)} />
          </Col>
          <Col span={24}>
            <Item label={i18n.t('Type Description')} value={selectType?.description} />
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
                  initValue: details?.name,
                  rules: [
                    { required: true, pattern: checkName, message: 'Please enter a valid workflow step name' },
                    { validator: checkStepNameRule },
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
                  initValue: details?.alias,
                  rules: [{ minLength: 2, maxLength: 64, message: 'Enter a string of 2 to 64 characters.' }],
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
                  initValue: details?.description,
                  rules: [{ maxLength: 256, message: 'Enter a description that contains less than 256 characters.' }],
                })}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    );
  };

  renderProperties = () => {
    const draft = this.props.draft(this.draftStep());
    const group = draft.step.type === 'step-group';
    return (
      <WorkflowEditContext.Provider value={{ stepName: draft.step.name, steps: draft.steps }}>
        {group && (
          <Form.Item label={<Translation>How the steps in this group run</Translation>}>
            <Select
              locale={locale().Select}
              value={(draft.step as WorkflowStepBase & { mode?: WorkflowMode }).mode}
              dataSource={[
                { value: 'StepByStep', label: i18n.t('In order').toString() },
                { value: 'DAG', label: i18n.t('In parallel').toString() },
              ]}
              onChange={(value: WorkflowMode) => this.setState({ groupMode: value })}
            />
          </Form.Item>
        )}
        <StepForm ref={this.form} inline step={draft.step} onUpdate={() => {}} onClose={this.props.onClose} />
      </WorkflowEditContext.Provider>
    );
  };

  render() {
    const { onClose } = this.props;
    const stages = this.stages();
    const stage = stages[this.state.stage];
    const group = this.chosen()?.name === 'step-group';
    const titles: Record<Stage, string> = { type: 'Type', details: 'Details', properties: 'Properties' };
    const last = this.state.stage === stages.length - 1;
    return (
      <Dialog
        locale={locale().Dialog}
        autoFocus={true}
        overflowScroll={true}
        onClose={onClose}
        width={800}
        title={i18n.t(group ? 'Add Group' : 'Add Step').toString()}
        visible
        v2
        footer={
          <div className="add-step-footer">
            <Button onClick={onClose}>
              <Translation>Cancel</Translation>
            </Button>
            {this.state.stage > 0 && (
              <Button onClick={this.back}>
                <Translation>Back</Translation>
              </Button>
            )}
            {last ? (
              <Button type="primary" onClick={this.add}>
                <Translation>Add</Translation>
              </Button>
            ) : (
              <Button type="primary" disabled={stage === 'type' && !this.chosen()} onClick={this.next}>
                <Translation>Next</Translation>
              </Button>
            )}
          </div>
        }
      >
        <Step current={this.state.stage} shape="circle" labelPlacement="hoz" className="add-step-stages">
          {stages.map((s) => (
            <Step.Item key={s} title={i18n.t(titles[s]).toString()} />
          ))}
        </Step>
        <div className="add-step-body">
          {stage === 'type' && this.renderType()}
          {stage === 'details' && this.renderDetails()}
          {stage === 'properties' && this.renderProperties()}
        </div>
      </Dialog>
    );
  }
}

export default AddStep;
