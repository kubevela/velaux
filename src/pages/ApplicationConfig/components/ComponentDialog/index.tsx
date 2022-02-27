import React from 'react';
import { Grid, Field, Form, Message, Button, Input, Divider } from '@b-design/ui';
import type { Rule } from '@alifd/field';
import { withTranslation } from 'react-i18next';
import { createApplicationComponent, updateComponentProperties } from '../../../../api/application';
import { detailComponentDefinition } from '../../../../api/application';
import type {
  DefinitionDetail,
  Trait,
  ApplicationComponentConfig,
} from '../../../../interface/application';
import UISchema from '../../../../components/UISchema';
import DrawerWithFooter from '../../../../components/Drawer';
import Translation from '../../../../components/Translation';
import { checkName } from '../../../../utils/common';
import Title from '../../../../components/Title';
import TraitsList from '../../components/TraitsList';
import _ from 'lodash';
import './index.less';

type Props = {
  appName?: string;
  componentName?: string;
  componentType: string;
  editComponent: any;
  isEditComponent: boolean;
  temporaryTraitList: Trait[];
  onAddTrait: () => void;
  changeTraitStats: (is: boolean, params: any) => void;
  onDeleteTrait: (type: string) => void;
  onComponentOK: () => void;
  onComponentClose: () => void;
  dispatch?: ({}) => {};
  t: (key: string) => {};
};

type State = {
  definitionDetail?: DefinitionDetail;
};

class ComponentDialog extends React.Component<Props, State> {
  field: Field;
  uiSchemaRef: React.RefObject<UISchema>;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.state = {};
    this.uiSchemaRef = React.createRef();
  }

  componentDidMount() {
    const { isEditComponent, editComponent } = this.props;
    if (isEditComponent && editComponent) {
      const { name, alias, type, description, properties } = editComponent;
      this.field.setValues({
        name,
        alias,
        type,
        description,
        properties,
      });
      if (type) {
        this.onDetailsComponentDefinition(type);
      }
    } else {
      const { componentType } = this.props;
      if (componentType) {
        this.onDetailsComponentDefinition(componentType);
      }
    }
  }

  onClose = () => {
    this.props.onComponentClose();
  };

  onSubmit = () => {
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { appName = '', componentName = '', componentType, temporaryTraitList } = this.props;
      const { name, alias = '', description = '', properties } = values;
      const params: ApplicationComponentConfig = {
        name,
        alias,
        description,
        properties: JSON.stringify(properties),
      };
      const { isEditComponent } = this.props;
      if (isEditComponent) {
        updateComponentProperties(params, { appName, componentName }).then((res) => {
          if (res) {
            Message.success({
              duration: 4000,
              title: 'Success',
              content: 'update Component config success.',
            });
            this.props.onComponentOK();
          }
        });
      } else {
        const traitLists = _.cloneDeep(temporaryTraitList);
        if (traitLists && traitLists.length != 0) {
          traitLists.forEach((item) => {
            if (item.properties) {
              item.properties = JSON.stringify(item.properties);
            }
          });
          params.name = `${appName}-${name}`;
          params.componentType = componentType;
          params.traits = traitLists;
          createApplicationComponent(params, { appName }).then((res) => {
            if (res) {
              Message.success({
                duration: 4000,
                title: 'Success',
                content: 'create Component config success.',
              });
              this.props.onComponentOK();
            }
          });
        }
      }
    });
  };

  onDetailsComponentDefinition = (value: string, callback?: () => void) => {
    detailComponentDefinition({ name: value })
      .then((re) => {
        if (re) {
          this.setState({ definitionDetail: re });
          if (callback) {
            callback();
          }
        }
      })
      .catch();
  };

  extButtonList = () => {
    const { onComponentClose, isEditComponent } = this.props;
    return (
      <div>
        <Button type="secondary" onClick={onComponentClose} className="margin-right-10">
          <Translation>Cancel</Translation>
        </Button>
        <Button type="primary" onClick={this.onSubmit}>
          <Translation>{isEditComponent ? 'Update' : 'Create'}</Translation>
        </Button>
      </div>
    );
  };

  showComponentTitle = () => {
    const { isEditComponent, editComponent } = this.props;
    if (isEditComponent && editComponent) {
      const { name = '', alias = '' } = editComponent;
      return (
        <div>
          <span>{alias ? `${alias}(${name})` : name}</span>
          <Divider />
        </div>
      );
    } else {
      return (
        <div>
          <Translation>{'Add Component'}</Translation>
          <Divider />
        </div>
      );
    }
  };

  getInitName = () => {
    const { isEditComponent, appName } = this.props;
    if (isEditComponent && appName) {
      return '';
    } else {
      return `${appName}-`;
    }
  };

  getTraitList = () => {
    const { isEditComponent, editComponent, temporaryTraitList } = this.props;
    if (isEditComponent && editComponent) {
      return editComponent.traits || [];
    } else {
      return [...temporaryTraitList, { opetationAdd: true }];
    }
  };

  render() {
    const init = this.field.init;
    const FormItem = Form.Item;
    const { Row, Col } = Grid;
    const { onComponentClose } = this.props;
    const { t, isEditComponent } = this.props;
    const { definitionDetail } = this.state;
    const validator = (rule: Rule, value: any, callback: (error?: string) => void) => {
      this.uiSchemaRef.current?.validate(callback);
    };
    return (
      <DrawerWithFooter
        title={this.showComponentTitle()}
        placement="right"
        width={800}
        onClose={onComponentClose}
        extButtons={this.extButtonList()}
      >
        <Form field={this.field} className="basic-config-wraper">
          <section className="title">
            <Title title="Component Config" actions={[]} />
          </section>

          <Row>
            <Col span={12} style={{ paddingRight: '8px' }}>
              <FormItem
                label={<Translation>Name</Translation>}
                labelTextAlign="left"
                required={true}
              >
                <Input
                  name="name"
                  maxLength={32}
                  disabled={isEditComponent ? true : false}
                  addonTextBefore={this.getInitName()}
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

            <Col span={12} style={{ paddingLeft: '8px' }}>
              <FormItem label={<Translation>Alias</Translation>}>
                <Input
                  name="alias"
                  placeholder={t('Please enter').toString()}
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
            <Col span={24}>
              <FormItem label={<Translation>Description</Translation>}>
                <Input
                  name="description"
                  placeholder={t('Please enter').toString()}
                  {...init('description', {
                    rules: [
                      {
                        maxLength: 256,
                        message: 'Enter a description that contains less than 256 characters.',
                      },
                    ],
                  })}
                />
              </FormItem>
            </Col>
          </Row>
          <Divider />
          <Row>
            <UISchema
              {...init(`properties`, {
                rules: [
                  {
                    validator: validator,
                    message: 'Please check app deploy properties',
                  },
                ],
              })}
              uiSchema={definitionDetail && definitionDetail.uiSchema}
              ref={this.uiSchemaRef}
              mode={isEditComponent ? 'edit' : 'new'}
            />
          </Row>
        </Form>
        <div className="trait-config-wraper">
          <section className="title">
            <Title title="Traits" actions={[]} />
          </section>
          <TraitsList
            traits={this.getTraitList()}
            isEditComponent={isEditComponent}
            changeTraitStats={(is: boolean, trait: Trait) => {
              this.props.changeTraitStats(is, trait);
            }}
            onDeleteTrait={(traitType: string) => {
              this.props.onDeleteTrait(traitType || '');
            }}
            onAdd={this.props.onAddTrait}
          />
        </div>
      </DrawerWithFooter>
    );
  }
}

export default withTranslation()(ComponentDialog);
