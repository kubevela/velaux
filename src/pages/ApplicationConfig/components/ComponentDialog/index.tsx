import React from 'react';
import { Grid, Field, Form, Message, Button, Input, Select, Divider } from '@b-design/ui';
import type { Rule } from '@alifd/field';
import { withTranslation } from 'react-i18next';
import {
  createApplicationComponent,
  updateComponentProperties,
  detailComponentDefinition,
} from '../../../../api/application';
import type {
  DefinitionDetail,
  Trait,
  ApplicationComponent,
  ApplicationComponentConfig,
} from '../../../../interface/application';
import UISchema from '../../../../components/UISchema';
import DrawerWithFooter from '../../../../components/Drawer';
import Translation from '../../../../components/Translation';
import { checkName } from '../../../../utils/common';
import Title from '../../../../components/Title';
import TraitsList from '../../components/TraitsList';
import { Link } from 'dva/router';
import locale from '../../../../utils/locale';
import { If } from 'tsx-control-statements/components';
import _ from 'lodash';
import i18n from 'i18next';
import { transComponentDefinitions } from '../../../../utils/utils';
import './index.less';

type Props = {
  appName?: string;
  componentName?: string;
  editComponent?: ApplicationComponent;
  isEditComponent: boolean;
  temporaryTraitList: Trait[];
  componentDefinitions: [];
  onAddTrait: () => void;
  changeTraitStats: (is: boolean, params: any) => void;
  onDeleteTrait: (type: string) => void;
  onComponentOK: () => void;
  onComponentClose: () => void;
};

type State = {
  definitionDetail?: DefinitionDetail;
  isCreateComponentLoading: boolean;
  isUpdateComponentLoading: boolean;
};

class ComponentDialog extends React.Component<Props, State> {
  field: Field;
  uiSchemaRef: React.RefObject<UISchema>;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.state = {
      isCreateComponentLoading: false,
      isUpdateComponentLoading: false,
    };
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
      const getInitComponentType: string = this.field.getValue('componentType') || '';
      this.onDetailsComponentDefinition(getInitComponentType);
    }
  }

  onClose = () => {
    this.props.onComponentClose();
  };

  onSubmitCreate = () => {
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { appName = '', temporaryTraitList } = this.props;
      const { name, alias = '', description = '', componentType = '', properties } = values;
      const params: ApplicationComponentConfig = {
        name,
        alias,
        description,
        componentType,
        properties: JSON.stringify(properties),
      };

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
        this.setState({ isCreateComponentLoading: true });
        createApplicationComponent(params, { appName }).then((res) => {
          if (res) {
            Message.success({
              duration: 4000,
              title: i18n.t('Success'),
              content: i18n.t('Create component success.'),
            });
            this.props.onComponentOK();
          }
          this.setState({ isCreateComponentLoading: false });
        });
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
    const { isCreateComponentLoading } = this.state;
    return (
      <div>
        <Button type="secondary" onClick={onComponentClose} className="margin-right-10">
          {i18n.t('Cancel')}
        </Button>
        <If condition={!isEditComponent}>
          <Button type="primary" onClick={this.onSubmitCreate} loading={isCreateComponentLoading}>
            {i18n.t('Create')}
          </Button>
        </If>
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
          <span> {i18n.t('Add Component')} </span>
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
      return [...(editComponent.traits || [])];
    } else {
      return [...temporaryTraitList];
    }
  };

  onSumitEditCompont = () => {
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { appName = '', componentName = '' } = this.props;
      const { name, alias = '', description = '', componentType = '', properties } = values;
      const params: ApplicationComponentConfig = {
        name,
        alias,
        description,
        componentType,
        properties: JSON.stringify(properties),
      };
      this.setState({ isUpdateComponentLoading: true });
      updateComponentProperties(params, { appName, componentName }).then((res) => {
        if (res) {
          Message.success({
            duration: 4000,
            title: i18n.t('Success'),
            content: i18n.t('Update component success.'),
          });
          this.props.onComponentOK();
        }
        this.setState({ isUpdateComponentLoading: false });
      });
    });
  };

  render() {
    const init = this.field.init;
    const FormItem = Form.Item;
    const { Row, Col } = Grid;
    const {isEditComponent, componentDefinitions, onComponentClose } = this.props;
    const { definitionDetail, isUpdateComponentLoading } = this.state;
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
            <Title title={i18n.t('Component Config')} actions={[]} />
          </section>

          <Row>
            <Col span={12} style={{ paddingRight: '8px' }}>
              <FormItem
                label={
                  <Translation className="font-size-14 font-weight-bold color333">Name</Translation>
                }
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
                  placeholder={i18n.t('Please enter').toString()}
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
                  placeholder={i18n.t('Please enter').toString()}
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
          <Row>
            <Col span={24}>
              <FormItem
                label={
                  <Translation className="font-size-14 font-weight-bold color333">Type</Translation>
                }
                required={true}
                help={
                  <span>
                    <Translation>Get more component type?</Translation>
                    <Link to="/addons"> <Translation>Go to enable addon</Translation></Link>
                  </span>
                }
              >
                <Select
                  locale={locale.Select}
                  showSearch
                  disabled={isEditComponent ? true : false}
                  className="select"
                  {...init(`componentType`, {
                    initValue: 'webservice',
                    rules: [
                      {
                        required: true,
                        message: i18n.t('Please select'),
                      },
                    ],
                  })}
                  dataSource={transComponentDefinitions(componentDefinitions)}
                  onChange={(item: string) => {
                    this.onDetailsComponentDefinition(item, () => {
                      this.field.setValue('componentType', item);
                    });
                  }}
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
                    message: i18n.t('Please check app deploy properties'),
                  },
                ],
              })}
              uiSchema={definitionDetail && definitionDetail.uiSchema}
              ref={this.uiSchemaRef}
              mode={isEditComponent ? 'edit' : 'new'}
            />
          </Row>
          <If condition={isEditComponent}>
            <div className="edit-component-update-btn">
              <Button
                type="primary"
                onClick={this.onSumitEditCompont}
                loading={isUpdateComponentLoading}
              >
                {i18n.t('Update')}
              </Button>
            </div>
          </If>
        </Form>
        <div className="trait-config-wraper">
          <section className="title">
            <Title title={i18n.t('Traits')} actions={[]} />
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
