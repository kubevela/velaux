import type { Rule } from '@alifd/field';
import { Grid, Field, Form, Message, Button, Input, Select, Card, Loading } from '@alifd/next';
import { connect } from 'dva';
import { Link } from 'dva/router';
import _ from 'lodash';
import React from 'react';

import {
  createApplicationComponent,
  updateComponentProperties,
  getApplicationComponent,
  getExpressionEnv,
  setExpressionOptIn,
} from '../../../../api/application';
import type { ExpressionContext } from '../../../../components/UISchema';
import type { ExpressionEnv } from '../../../../extends/ExpressionEditor';
import { detailComponentDefinition } from '../../../../api/definitions';
import { VersionSelect } from '../../../../components/VersionSelect';
import { joinType, splitType } from '../../../../utils/definitionVersion';
import { AwaitingType } from '../../../../components/AwaitingType';
import ModalWithFooter from '../../../../components/ModalWithFooter';
import { Translation } from '../../../../components/Translation';
import UISchema from '../../../../components/UISchema';
import i18n from '../../../../i18n';
import type {
  DefinitionDetail,
  Trait,
  ApplicationComponent,
  ApplicationComponentConfig,
  ApplicationComponentBase,
} from '@velaux/data';
import { checkName } from '../../../../utils/common';
import { locale } from '../../../../utils/locale';
import { transComponentDefinitions } from '../../../../utils/utils';

import './index.less';
import '../ComponentList/index.less';
import { AiOutlineLink } from 'react-icons/ai';
import type { ComponentDependency } from '@velaux/data';
import type { DependencyItem } from '../../../../utils/dependencies';

import { dependsOnOptions } from '../ComponentList/model';

import Permission from '../../../../components/Permission';
import { If } from '../../../../components/If';
import { BiCodeBlock, BiLaptop } from 'react-icons/bi';

type Props = {
  appName?: string;
  project: string;
  componentName?: string;
  isEditComponent: boolean;
  temporaryTraitList: Trait[];
  componentDefinitions: [];
  components: ApplicationComponentBase[];
  onComponentOK: () => void;
  onComponentClose: () => void;
  dispatch?: any;
  // deployed says the application has been deployed, which is when its
  // immutable parameters lock.
  deployed?: boolean;
  // dependencies are the component's, both ways, as the deployed Application
  // reports them.
  dependencies?: DependencyItem[];
  // dependencyEdges are every component's dependencies the Application reports.
  dependencyEdges?: ComponentDependency[];
};

type State = {
  expressionEnv?: ExpressionEnv;
  definitionDetail?: DefinitionDetail;
  isCreateComponentLoading: boolean;
  isUpdateComponentLoading: boolean;
  editComponent?: ApplicationComponent;
  loading: boolean;
  propertiesMode: string;
};

@connect()
class ComponentDialog extends React.Component<Props, State> {
  field: Field;
  uiSchemaRef: React.RefObject<UISchema>;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.state = {
      isCreateComponentLoading: false,
      isUpdateComponentLoading: false,
      loading: true,
      propertiesMode: 'native',
    };
    this.uiSchemaRef = React.createRef();
  }

  loadExpressionEnv = async () => {
    const { appName } = this.props;
    if (!appName) {
      return;
    }
    try {
      const env: ExpressionEnv = await getExpressionEnv(appName, 'component');
      this.setState({ expressionEnv: env });
    } catch (e) {
      this.setState({ expressionEnv: undefined });
    }
  };

  setExpressionOptIn = async (on: boolean): Promise<boolean> => {
    const { appName } = this.props;
    if (!appName) {
      return false;
    }
    try {
      await setExpressionOptIn(appName, on);
    } catch (e) {
      return false;
    }
    await this.loadExpressionEnv();
    return true;
  };

  expressionContext = (): ExpressionContext | undefined => {
    const { appName } = this.props;
    if (!appName) {
      return undefined;
    }
    return {
      appName,
      surface: 'component',
      env: this.state.expressionEnv,
      onOptIn: this.setExpressionOptIn,
    };
  };

  componentDidMount() {
    this.loadExpressionEnv();
    const { isEditComponent, dispatch, appName, project } = this.props;
    if (isEditComponent) {
      this.onGetEditComponentInfo(() => {
        if (this.state.editComponent) {
          const { name, alias, type, description, properties, dependsOn } = this.state.editComponent;
          const pinned = splitType(type);
          this.field.setValues({
            name,
            alias,
            componentType: pinned.name,
            componentVersion: pinned.version,
            description,
            properties,
            dependsOn,
          });
          if (pinned.name) {
            this.onDetailsComponentDefinition(pinned.name, pinned.version);
          }
        }
      });
    } else {
      const getInitComponentType: string = this.field.getValue('componentType') || '';
      if (getInitComponentType) {
        this.onDetailsComponentDefinition(getInitComponentType);
      } else {
        this.setState({ loading: false });
      }
    }
    dispatch({
      type: 'uischema/setAppName',
      payload: appName,
    });
    dispatch({
      type: 'uischema/setProject',
      payload: project,
    });
  }

  onGetEditComponentInfo(callback?: () => void) {
    const { appName, componentName } = this.props;
    this.setState({ loading: true });
    if (appName && componentName) {
      getApplicationComponent(appName, componentName).then((res: ApplicationComponent) => {
        if (res) {
          this.setState(
            {
              editComponent: res,
              loading: false,
            },
            callback
          );
        }
      });
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
      const { appName = '', temporaryTraitList = [] } = this.props;
      const { name, alias = '', description = '', properties, dependsOn = [] } = values;
      const componentType = joinType(values.componentType || '', this.field.getValue('componentVersion'));
      const params: ApplicationComponentConfig = {
        name,
        alias,
        description,
        componentType,
        properties: JSON.stringify(properties),
      };

      const traitLists = _.cloneDeep(temporaryTraitList);
      traitLists.forEach((item) => {
        if (item.properties) {
          item.properties = JSON.stringify(item.properties);
        }
      });
      params.name = `${appName}-${name}`;
      params.componentType = componentType;
      params.traits = traitLists;
      params.dependsOn = dependsOn;
      this.setState({ isCreateComponentLoading: true });
      createApplicationComponent(params, { appName }).then((res) => {
        if (res) {
          Message.success({
            duration: 4000,
            content: i18n.t('Component created successfully').toString(),
          });
          this.props.onComponentOK();
        }
        this.setState({ isCreateComponentLoading: false });
      });
    });
  };

  // onDetailsComponentDefinition loads a component type's form, at the version
  // it is pinned to or the latest.
  onDetailsComponentDefinition = (value: string, version?: string) => {
    detailComponentDefinition({ name: value, revision: version })
      .then((re) => {
        if (re) {
          this.setState({ definitionDetail: re, loading: false });
        }
      })
      .catch();
  };

  extButtonList = () => {
    const { onComponentClose, isEditComponent, project, componentName, appName } = this.props;
    const { isCreateComponentLoading, isUpdateComponentLoading } = this.state;
    return (
      <div className="footer-actions">
        <Button type="secondary" onClick={onComponentClose} className="margin-right-10">
          {i18n.t('Cancel').toString()}
        </Button>
        <If condition={!isEditComponent}>
          <Permission
            request={{
              resource: `project:${project}/application:${appName}/component:*`,
              action: 'create',
            }}
            project={project}
          >
            <Button type="primary" onClick={this.onSubmitCreate} loading={isCreateComponentLoading}>
              {i18n.t('Create').toString()}
            </Button>
          </Permission>
        </If>
        <If condition={isEditComponent}>
          <Permission
            request={{
              resource: `project:${project}/application:${appName}/component:${componentName || '*'}`,
              action: 'update',
            }}
            project={project}
          >
            <Button type="primary" onClick={this.onSubmitEditComponent} loading={isUpdateComponentLoading}>
              {i18n.t('Update').toString()}
            </Button>
          </Permission>
        </If>
      </div>
    );
  };

  showComponentTitle = () => {
    const { isEditComponent } = this.props;
    const { editComponent } = this.state;
    if (isEditComponent && editComponent) {
      const { name = '', alias = '' } = editComponent;
      return (
        <div>
          <span>{alias ? `${alias}(${name})` : name}</span>
        </div>
      );
    } else {
      return (
        <div>
          <span>{i18n.t('New Component')} </span>
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
    const { editComponent } = this.state;
    const { isEditComponent, temporaryTraitList } = this.props;
    if (isEditComponent && editComponent) {
      return [...(editComponent.traits || [])];
    } else {
      return [...temporaryTraitList];
    }
  };

  onSubmitEditComponent = () => {
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { appName = '', componentName = '' } = this.props;
      const { name, alias = '', description = '', properties, dependsOn = [] } = values;
      const componentType = joinType(values.componentType || '', this.field.getValue('componentVersion'));
      const params: ApplicationComponentConfig = {
        name,
        alias,
        description,
        componentType,
        properties: JSON.stringify(properties),
        dependsOn,
      };
      this.setState({ isUpdateComponentLoading: true });
      updateComponentProperties(params, { appName, componentName }).then((res) => {
        if (res) {
          Message.success({
            duration: 4000,
            content: i18n.t('Component updated successfully').toString(),
          });
          this.props.onComponentOK();
        }
        this.setState({ isUpdateComponentLoading: false });
      });
    });
  };

  removeProperties = () => {
    this.field.remove('properties');
    this.setState({ definitionDetail: undefined });
  };

  getDependsOptions = () => {
    const { components, componentName, dependencies = [], dependencyEdges = [] } = this.props;
    return dependsOnOptions(components || [], componentName, dependencies, dependencyEdges);
  };

  render() {
    const inferredDeps = (this.props.dependencies || []).filter((d) => d.direction === 'outbound' && d.inferred);
    const init = this.field.init;
    const FormItem = Form.Item;
    const { Row, Col } = Grid;
    const { isEditComponent, componentDefinitions, onComponentClose } = this.props;
    const { definitionDetail, loading, propertiesMode } = this.state;
    // A new component's type comes first; the rest waits for it.
    const ready = !!isEditComponent || !!this.field.getValue('componentType');
    const validator = (rule: Rule, value: any, callback: (error?: string) => void) => {
      this.uiSchemaRef.current?.validate(callback);
    };

    return (
      <ModalWithFooter title={this.showComponentTitle()} onClose={onComponentClose} extButtons={this.extButtonList()}>
        <Form field={this.field} className="basic-config-wrapper">
          <Loading visible={loading} style={{ width: '100%' }}>
            <Card contentHeight={'auto'} title="Basic Configuration">
              <Row>
                <Col span={12} style={{ paddingRight: '8px' }}>
                  <FormItem
                    label={<Translation className="font-size-14 font-weight-bold color333">Type</Translation>}
                    required={true}
                    help={
                      <span>
                        <Translation>Get more component type?</Translation>
                        <Link to="/addons">
                          <Translation>Go to enable addon</Translation>
                        </Link>
                      </span>
                    }
                  >
                    <Select
                      locale={locale().Select}
                      showSearch
                      disabled={isEditComponent ? true : false}
                      className="select"
                      {...init(`componentType`, {
                        rules: [
                          {
                            required: true,
                            message: i18n.t('Please select'),
                          },
                        ],
                      })}
                      dataSource={transComponentDefinitions(componentDefinitions)}
                      onChange={(item: string) => {
                        this.removeProperties();
                        this.field.setValue('componentType', item);
                        this.field.setValue('componentVersion', undefined);
                        this.onDetailsComponentDefinition(item);
                      }}
                    />
                  </FormItem>
                </Col>
                <Col span={12} style={{ paddingLeft: '8px' }}>
                  <FormItem
                    label={<Translation className="font-size-14 font-weight-bold color333">Version</Translation>}
                  >
                    <VersionSelect
                      definitionType="component"
                      name={this.field.getValue('componentType')}
                      value={this.field.getValue('componentVersion')}
                      onChange={(version?: string) => {
                        this.field.setValue('componentVersion', version);
                        this.onDetailsComponentDefinition(this.field.getValue('componentType'), version);
                      }}
                    />
                  </FormItem>
                </Col>
              </Row>
              <AwaitingType ready={ready}>
                <Row>
                  <Col span={12} style={{ paddingRight: '8px' }}>
                    <FormItem
                      label={<Translation className="font-size-14 font-weight-bold color333">Name</Translation>}
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
                  <Col span={12} style={{ paddingRight: '8px' }}>
                    <FormItem
                      label={<Translation className="font-size-14 font-weight-bold color333">Depends On</Translation>}
                    >
                      <Select
                        {...init(`dependsOn`, {
                          rules: [
                            {
                              required: false,
                              message: i18n.t('Please select'),
                            },
                          ],
                        })}
                        locale={locale().Select}
                        mode="multiple"
                        dataSource={this.getDependsOptions()}
                        itemRender={(item: any) =>
                          item.inferred ? (
                            <span className="depends-option" title={item.inferred}>
                              {item.label}
                              <span className="depends-option-inferred">
                                <AiOutlineLink /> <Translation>inferred</Translation>
                              </span>
                            </span>
                          ) : (
                            item.label
                          )
                        }
                      />
                      {inferredDeps.length > 0 && (
                        <div className="depends-inferred">
                          <Translation>Inferred from expressions</Translation>:
                          {inferredDeps.map((d) => (
                            <span key={d.name + (d.where || '')} className="component-dep inferred" title={d.inferred}>
                              <AiOutlineLink />
                              {d.name}
                              {d.where && <span className="component-dep-where">{d.where}</span>}
                            </span>
                          ))}
                        </div>
                      )}
                    </FormItem>
                  </Col>
                </Row>
              </AwaitingType>
            </Card>
          </Loading>
          <AwaitingType ready={ready}>
            <Card
              contentHeight={'auto'}
              className="withActions"
              title="Deployment Properties"
              subTitle={
                definitionDetail && definitionDetail.uiSchema
                  ? [
                      <Button
                        style={{ alignItems: 'center', display: 'flex' }}
                        onClick={() => {
                          if (propertiesMode === 'native') {
                            this.setState({ propertiesMode: 'code' });
                          } else {
                            this.setState({ propertiesMode: 'native' });
                          }
                        }}
                      >
                        {propertiesMode === 'native' && (
                          <BiCodeBlock size={14} title={i18n.t('Switch to the coding mode')} />
                        )}
                        {propertiesMode === 'code' && (
                          <BiLaptop size={14} title={i18n.t('Switch to the native mode')} />
                        )}
                      </Button>,
                    ]
                  : []
              }
            >
              <Row>
                <If condition={definitionDetail}>
                  <UISchema
                    {...init(`properties`, {
                      rules: [
                        {
                          validator: validator,
                          message: i18n.t('Please check the component properties'),
                        },
                      ],
                    })}
                    enableCodeEdit={propertiesMode === 'code'}
                    uiSchema={definitionDetail && definitionDetail.uiSchema}
                    definition={{
                      name: definitionDetail?.name || '',
                      type: 'component',
                      description: definitionDetail?.description || '',
                    }}
                    ref={this.uiSchemaRef}
                    mode={isEditComponent ? 'edit' : 'new'}
                    deployed={this.props.deployed}
                    expressions={this.expressionContext()}
                  />
                </If>
              </Row>
            </Card>
          </AwaitingType>
        </Form>
      </ModalWithFooter>
    );
  }
}

export default ComponentDialog;
