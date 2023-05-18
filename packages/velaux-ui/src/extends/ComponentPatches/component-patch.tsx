import type { Rule } from '@alifd/next/lib/field';
import { Card, Form, Select, Grid, Field, Balloon, Message } from '@alifd/next';
import classNames from 'classnames';
import { connect } from 'dva';
import React from 'react';
import { AiOutlineDelete } from 'react-icons/ai';

import { getApplicationComponent } from '../../api/application';
import { CustomSelect } from '../../components/CustomSelect';
import { If } from '../../components/If';
import { Translation } from '../../components/Translation';
import i18n from '../../i18n';
import type { ApplicationComponent, ApplicationComponentBase, Trait } from '@velaux/data';
import { locale } from '../../utils/locale';
const { Col, Row } = Grid;

type Props = {
  projectName: string;
  appName: string;
  value?: ComponentPatchData;
  id: string;
  onChange: (value: ComponentPatchData) => void;
  onRemove: (id: string) => void;
  disabled: boolean;
  componentOptions: Array<{ label: string; value: string }>;
  getComponents: (name?: string, type?: string) => ApplicationComponentBase[] | undefined;
  componentTypeOptions: Array<{ label: string; value: string }>;
  registerForm: (form: Field) => void;
};

type State = {
  components?: ApplicationComponentBase[];
};

export interface ComponentPatchData {
  id?: string;
  name?: string;
  type?: string;
  properties?: any;
  traits?: TraitPatch[];
}

export interface TraitPatch {
  type: string;
  properties: any;
  disable?: boolean;
}

@connect((store: any) => {
  return { ...store.uischema };
})
class ComponentPatch extends React.Component<Props, State> {
  form: Field;
  constructor(props: Props) {
    super(props);
    this.state = {};
    this.form = new Field(this, {
      onChange: (name: string) => {
        if (name == 'name' || name == 'type') {
          this.onLoadComponents();
        }
        this.onSubmit();
      },
      values: { ...props.value },
    });
    this.props.registerForm(this.form);
  }

  componentDidMount = () => {
    this.onLoadComponents();
  };

  onSubmit = () => {
    this.form.validate((error, res: any) => {
      if (error) {
        return;
      }
      this.props.onChange({ ...res });
    });
  };

  onLoadComponents = () => {
    const name: string | undefined = this.form.getValue('name');
    const type: string | undefined = this.form.getValue('type');
    const components = this.props.getComponents(name, type);
    this.setState({
      components: components,
    });
  };

  setFormValue = (name: string, value: any) => {
    this.form.setValue(name, value);
    this.onSubmit();
  };

  loadAndSetComponentProperties = (com?: ApplicationComponentBase) => {
    const { appName } = this.props;
    if (com) {
      getApplicationComponent(appName, com.name).then((res: ApplicationComponent) => {
        this.form.setValue('properties', res.properties);
        this.onSubmit();
        Message.success('Assign the default values for the properties successfully');
      });
    }
  };

  render() {
    const { value, id, disabled } = this.props;
    const { componentOptions, componentTypeOptions } = this.props;
    const { init } = this.form;
    const { components } = this.state;
    const traits: Trait[] = [];
    const traitKey = new Map<string, string>();
    components?.map((com) => {
      com.traits?.map((t) => {
        if (!traitKey.get(t.type)) {
          traits.push(t);
          traitKey.set(t.type, t.type);
        }
      });
    });
    const traitPatches: TraitPatch[] = this.form.getValue('traits') || [];
    const traitPatchMap = new Map<string, TraitPatch>();
    traitPatches.map((item) => {
      traitPatchMap.set(item.type, item);
    });

    const validatorName = (rule: Rule, v: any, callback: (error?: string) => void) => {
      if (!v && !this.form.getValue('type')) {
        callback('Please select a component or component type.');
        return;
      }
      callback();
    };
    const validatorType = (rule: Rule, v: any, callback: (error?: string) => void) => {
      if (!v && !this.form.getValue('name')) {
        callback('Please select a component or component type.');
        return;
      }
      callback();
    };
    const notice =
      "If you want to create the patch for the component or trait properties, let's switch to the coding mode.";
    return (
      <Card
        id={id}
        className="withActions"
        title={'Component patch configuration'}
        contentHeight={'auto'}
        subTitle={
          <a onClick={() => this.props.onRemove(id)}>
            <AiOutlineDelete size={15} />
          </a>
        }
      >
        <Form field={this.form}>
          <Row>
            <Col span={12} style={{ padding: '0 8px' }}>
              <Form.Item label={i18n.t('Name').toString()}>
                <Select
                  placeholder={i18n.t('You can base a component to set the patch configuration')}
                  disabled={disabled}
                  dataSource={componentOptions}
                  hasClear
                  {...init('name', {
                    initValue: value?.name,
                    rules: [{ validator: validatorName }],
                  })}
                  locale={locale().Select}
                  onBlur={this.onSubmit}
                />
              </Form.Item>
            </Col>
            <Col span={12} style={{ padding: '0 8px' }}>
              <Form.Item label={i18n.t('Type').toString()}>
                <CustomSelect
                  placeholder={i18n.t('You can base a component type to set the patch configuration')}
                  disabled={disabled}
                  dataSource={componentTypeOptions}
                  hasClear
                  enableInput
                  {...init('type', {
                    initValue: value?.type,
                    rules: [{ validator: validatorType }],
                  })}
                  locale={locale().Select}
                  onBlur={this.onSubmit}
                />
              </Form.Item>
            </Col>
          </Row>
          <If condition={traits}>
            <div style={{ padding: '0 8px' }}>
              <Form.Item label="Traits" {...init('traits', {})}>
                <Row wrap={true}>
                  {traits.map((trait) => {
                    const label = trait.alias ? trait.alias + '(' + trait.type + ')' : trait.type;
                    const disable = traitPatchMap.get(trait.type)?.disable;
                    const icon = (
                      <AiOutlineDelete
                        onClick={(event: React.MouseEvent<SVGAElement>) => {
                          event.stopPropagation();
                          if (disable) {
                            this.setFormValue(
                              'traits',
                              traitPatches.filter((t) => t.type != trait.type)
                            );
                          } else {
                            this.setFormValue('traits', [...traitPatches, { type: trait.type, disable: true }]);
                          }
                        }}
                        size={14}
                        className="danger-icon"
                        title={disable ? i18n.t('Cancel Disable') : i18n.t('Disable')}
                      />
                    );
                    return (
                      <div
                        key={trait.type}
                        onClick={() => {}}
                        className={classNames('trait-icon', {
                          disable: disable,
                        })}
                        title={disable ? 'Disabled' : ''}
                      >
                        <div>{label}</div>
                        <div className="trait-actions">
                          <Balloon trigger={icon}>{disable ? i18n.t('Cancel Disable') : i18n.t('Disable')}</Balloon>
                        </div>
                      </div>
                    );
                  })}
                </Row>
              </Form.Item>
            </div>
          </If>
          <If condition={components}>
            <div style={{ padding: '0 8px' }}>
              <Form.Item label="Properties" {...init('properties', {})}>
                <Message type="notice">
                  <Translation>{notice}</Translation>
                  <If condition={components?.length == 1}>
                    <a
                      onClick={() => {
                        this.loadAndSetComponentProperties(components && components[0]);
                      }}
                    >
                      <Translation>Assign the default properties</Translation>
                    </a>
                  </If>
                </Message>
              </Form.Item>
            </div>
          </If>
        </Form>
      </Card>
    );
  }
}

export default ComponentPatch;
