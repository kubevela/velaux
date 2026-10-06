import type { Rule } from '@alifd/field';
import { Grid, Field, Form, Select, Message, Button, Input, Icon, Card, Loading } from '@alifd/next';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React from 'react';
import { BiCodeBlock, BiLaptop } from 'react-icons/bi';

import {
  updateTrait,
  createTrait,
  getApplicationComponent,
  getExpressionEnv,
  setExpressionOptIn,
} from '../../../../api/application';
import type { ExpressionContext } from '../../../../components/UISchema';
import type { ExpressionEnv } from '../../../../extends/ExpressionEditor';
import { detailTraitDefinition, getTraitDefinitions } from '../../../../api/definitions';
import { VersionSelect } from '../../../../components/VersionSelect';
import { joinType, splitType } from '../../../../utils/definitionVersion';
import { AwaitingType } from '../../../../components/AwaitingType';
import ModalWithFooter from '../../../../components/ModalWithFooter';
import { If } from '../../../../components/If';
import { Translation } from '../../../../components/Translation';
import UISchema from '../../../../components/UISchema';
import i18n from '../../../../i18n';
import type { ApplicationComponent, DefinitionDetail, Trait, DefinitionBase, EnvBinding } from '@velaux/data';
import { deployNamespaces, isUsable } from '../../../../utils/restrictions';

type Props = {
  project: string;
  isEditComponent: boolean;
  isEditTrait: boolean;
  visible: boolean;
  traitItem?: Trait;
  appName?: string;
  componentName?: string;
  temporaryTraitList: Trait[];
  createTemporaryTrait: (trait: Trait) => void;
  upDateTemporaryTrait: (trait: Trait) => void;
  onOK: () => void;
  onClose: () => void;
  // envbinding are where the application deploys, whose namespaces a trait
  // type's restrictions are checked against.
  envbinding: EnvBinding[];
  dispatch?: any;
  // deployed says the application has been deployed, which is when its
  // immutable parameters lock.
  deployed?: boolean;
};

type State = {
  // propertiesValid is whether the properties form can be saved as it stands.
  propertiesValid?: boolean;
  expressionEnv?: ExpressionEnv;
  definitionDetail?: DefinitionDetail;
  definitionLoading: boolean;
  isLoading: boolean;
  traitDefinitions?: DefinitionBase[];
  podDisruptive?: any;
  component?: ApplicationComponent;
  propertiesMode: 'native' | 'code';
};
@connect()
class TraitDialog extends React.Component<Props, State> {
  field: Field;
  uiSchemaRef: React.RefObject<UISchema>;
  constructor(props: Props) {
    super(props);
    this.state = {
      definitionLoading: false,
      isLoading: false,
      traitDefinitions: [],
      propertiesMode: 'native',
    };
    this.field = new Field(this);
    this.uiSchemaRef = React.createRef();
  }

  loadExpressionEnv = async () => {
    const { appName } = this.props;
    if (!appName) {
      return;
    }
    try {
      const env: ExpressionEnv = await getExpressionEnv(appName, 'trait', undefined, this.props.componentName);
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
      surface: 'trait',
      component: this.props.componentName,
      env: this.state.expressionEnv,
      onOptIn: this.setExpressionOptIn,
    };
  };

  componentDidMount() {
    this.loadExpressionEnv();
    this.onGetComponentInfo(() => {
      this.onGetTraitDefinitions();
      const { isEditTrait, traitItem, appName, project, dispatch } = this.props;
      if (isEditTrait && traitItem) {
        const { alias, type, description, properties } = traitItem;
        const pinned = splitType(type);
        this.field.setValues({
          alias,
          type: pinned.name,
          traitVersion: pinned.version,
          description,
          properties,
        });
        if (pinned.name) {
          this.onDetailsTraitDefinition(pinned.name, pinned.version);
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
    });
  }

  onGetComponentInfo(callback: () => void) {
    const { appName, componentName } = this.props;
    if (appName && componentName) {
      getApplicationComponent(appName, componentName).then((res: ApplicationComponent) => {
        if (res) {
          this.setState(
            {
              component: res,
            },
            callback
          );
        }
      });
    }
  }

  onGetTraitDefinitions = async () => {
    const { component } = this.state;
    if (component?.definition) {
      getTraitDefinitions({
        appliedWorkload: component?.definition.workload.type,
        namespaces: deployNamespaces(this.props.envbinding),
      }).then((res: { definitions?: DefinitionBase[] }) => {
        if (res) {
          const podDisruptive: any = {};
          res.definitions?.map((def) => {
            if (def.trait?.podDisruptive) {
              podDisruptive[def.name] = true;
            }
          });
          this.setState({
            traitDefinitions: res && res.definitions,
            podDisruptive: podDisruptive,
          });
        }
      });
    }
  };

  onClose = () => {
    this.props.onClose();
  };

  onSubmit = () => {
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { appName = '', componentName = '', temporaryTraitList = [] } = this.props;
      const { alias = '', description = '', properties } = values;
      const type = joinType(values.type || '', this.field.getValue('traitVersion'));
      // A trait is found by the type it was saved with, which a new version changes.
      const query = {
        appName,
        componentName,
        traitType: this.props.isEditTrait ? this.props.traitItem?.type || type : type,
      };
      const params: Trait = {
        alias,
        type,
        description,
        properties: JSON.stringify(properties),
      };
      const { isEditTrait, isEditComponent } = this.props;
      this.setState({ isLoading: true });
      if (isEditComponent) {
        if (isEditTrait) {
          updateTrait(params, query).then((res) => {
            if (res) {
              Message.success({
                duration: 4000,
                title: i18n.t('Trait properties update success.').toString(),
                content: i18n.t('You need to re-execute the workflow for it to take effect.').toString(),
              });
              this.props.onOK();
            }
            this.setState({ isLoading: false });
          });
        } else {
          createTrait(params, query).then((res) => {
            if (res) {
              Message.success({
                duration: 4000,
                title: i18n.t('Trait create success.').toString(),
                content: i18n.t('You need to re-execute the workflow for it to take effect.').toString(),
              });
              this.props.onOK();
            }
            this.setState({ isLoading: false });
          });
        }
      } else {
        const findSameType = temporaryTraitList.find((item) => splitType(item.type).name === splitType(type).name);
        if (!isEditTrait && !findSameType) {
          params.properties = JSON.parse(params.properties);
          this.props.createTemporaryTrait(params);
        } else if (!isEditTrait && findSameType) {
          return Message.warning(i18n.t('A trait with the same trait type exists, please modify it'));
        } else if (isEditTrait) {
          params.properties = JSON.parse(params.properties);
          this.props.upDateTemporaryTrait(params);
        }
      }
    });
  };

  transTraitDefinitions() {
    const { traitDefinitions } = this.state;
    return (traitDefinitions || []).filter(isUsable).map((item) => ({ label: item.name, value: item.name }));
  }

  // onDetailsTraitDefinition loads a trait type's form, at the version it is
  // pinned to or the latest.
  onDetailsTraitDefinition = (value: string, version?: string) => {
    this.setState({ definitionLoading: true });
    detailTraitDefinition({ name: value, revision: version })
      .then((re) => {
        if (re) {
          this.setState({ definitionDetail: re, definitionLoading: false });
          this.setDefaultProperties(re);
        }
      })
      .catch(() => this.setState({ definitionLoading: false }));
  };

  setDefaultProperties = (definitionDetail: any) => {
    const properties = definitionDetail.schema?.properties;
    if (properties) {
      const defaultValues: Record<string, any> = {};
      for (const key in properties) {
        if (properties[key].default !== undefined) {
          defaultValues[key] = properties[key].default;
        }
      }
      this.field.setValues({ properties: defaultValues });
    }
  };

  handleTypeChange = (value: string) => {
    this.removeProperties();
    this.field.setValues({ type: value, traitVersion: undefined });
    this.onDetailsTraitDefinition(value);
    this.setAlias(value);
  };

  setAlias = (traitType: string) => {
    let alias = traitType;
    switch (traitType) {
      case 'scaler':
        alias = i18n.t('Manual Scaler');
        break;
      case 'http-route':
        alias = i18n.t('HTTP Route');
        break;
      case 'https-route':
        alias = i18n.t('HTTPs Route');
        break;
      case 'gateway':
        alias = i18n.t('HTTP Route');
        break;
      default:
    }
    this.field.setValue('alias', alias);
  };

  extButtonList = () => {
    const { onClose, isEditTrait } = this.props;
    const { isLoading } = this.state;
    return (
      <div>
        <Button type="secondary" onClick={onClose} className="margin-right-10">
          <Translation>Cancel</Translation>
        </Button>
        <Button
          type="primary"
          onClick={this.onSubmit}
          disabled={this.state.propertiesValid === false}
          title={
            this.state.propertiesValid === false ? i18n.t('Fix the highlighted properties first').toString() : undefined
          }
          loading={isLoading}
        >
          <Translation>{isEditTrait ? i18n.t('Update') : i18n.t('Create')}</Translation>
        </Button>
      </div>
    );
  };

  showTraitTitle = () => {
    const { isEditTrait, onClose } = this.props;
    if (isEditTrait) {
      return (
        <span>
          <Icon type="arrow-left" onClick={onClose} className="cursor-pointer" />
          <span> {i18n.t('Edit Trait')} </span>
        </span>
      );
    } else {
      return (
        <span>
          <Icon type="arrow-left" onClick={onClose} className="cursor-pointer" />
          <span> {i18n.t('Add Trait')} </span>
        </span>
      );
    }
  };

  removeProperties = () => {
    this.field.remove('properties');
    this.setState({ definitionDetail: undefined });
  };

  render() {
    const init = this.field.init;
    const FormItem = Form.Item;
    const { Row, Col } = Grid;
    const { onClose, isEditTrait } = this.props;
    const { definitionDetail, definitionLoading, podDisruptive, propertiesMode } = this.state;
    const validator = (rule: Rule, value: any, callback: (error?: string) => void) => {
      this.uiSchemaRef.current?.validate(callback);
    };
    const traitType: string = this.field.getValue('type');
    // The trait's type comes first; the rest waits for it.
    const ready = !!isEditTrait || !!traitType;

    return (
      <ModalWithFooter title={this.showTraitTitle()} onClose={onClose} extButtons={this.extButtonList()}>
        <Form field={this.field}>
          <If condition={podDisruptive && traitType && podDisruptive[traitType]}>
            <Row>
              <Col span={24}>
                <Message
                  type="warning"
                  title={i18n
                    .t('This trait properties change will cause pod restart after the application deploy')
                    .toString()}
                />
              </Col>
            </Row>
          </If>
          <Row>
            <Col span={12} style={{ padding: '0 8px' }}>
              <FormItem
                label={<Translation>Type</Translation>}
                required
                help={
                  <span>
                    <Translation>Get more trait type?</Translation>
                    <Link to="/addons">
                      <Translation>Go to enable addon</Translation>
                    </Link>
                  </span>
                }
              >
                <Select
                  className="select"
                  disabled={isEditTrait ? true : false}
                  placeholder={i18n.t('Please select').toString()}
                  {...init(`type`, {
                    rules: [
                      {
                        required: true,
                        message: i18n.t('Please select'),
                      },
                    ],
                  })}
                  dataSource={this.transTraitDefinitions()}
                  onChange={this.handleTypeChange}
                />
              </FormItem>
            </Col>
            <Col span={12} style={{ padding: '0 8px' }}>
              <FormItem label={<Translation>Version</Translation>}>
                <VersionSelect
                  definitionType="trait"
                  name={this.field.getValue('type')}
                  value={this.field.getValue('traitVersion')}
                  onChange={(version?: string) => {
                    this.field.setValue('traitVersion', version);
                    this.onDetailsTraitDefinition(this.field.getValue('type'), version);
                  }}
                />
              </FormItem>
            </Col>
          </Row>
          <AwaitingType ready={ready}>
            <Row>
              <Col span={12} style={{ padding: '0 8px' }}>
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

              <Col span={12} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Description</Translation>}>
                  <Input
                    name="description"
                    placeholder={i18n.t('Please enter').toString()}
                    {...init('description', {
                      rules: [
                        {
                          maxLength: 256,
                          message: i18n.t('Enter a description that contains less than 256 characters.'),
                        },
                      ],
                    })}
                  />
                </FormItem>
              </Col>
            </Row>
            <Row>
              <Col span={24} style={{ padding: '0 8px' }}>
                <Card
                  contentHeight={'auto'}
                  style={{ marginTop: '8px' }}
                  title={i18n.t('Properties').toString()}
                  className="withActions"
                  subTitle={
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
                      {propertiesMode === 'code' && <BiLaptop size={14} title={i18n.t('Switch to the native mode')} />}
                    </Button>
                  }
                >
                  <Loading visible={definitionLoading}>
                    <If condition={definitionDetail}>
                      <FormItem required={true}>
                        <UISchema
                          key={traitType}
                          {...init(`properties`, {
                            rules: [
                              {
                                validator: validator,
                                message: i18n.t('Please check trait deploy properties'),
                              },
                            ],
                          })}
                          enableCodeEdit={propertiesMode === 'code'}
                          uiSchema={definitionDetail && definitionDetail.uiSchema}
                          definition={{
                            type: 'trait',
                            name: definitionDetail?.name || '',
                            description: definitionDetail?.description || '',
                          }}
                          onValidityChange={(valid: boolean) => this.setState({ propertiesValid: valid })}
                          ref={this.uiSchemaRef}
                          mode={this.props.isEditTrait ? 'edit' : 'new'}
                          deployed={this.props.deployed}
                          expressions={this.expressionContext()}
                        />
                      </FormItem>
                    </If>
                    <If condition={!definitionDetail}>
                      <Message type="notice">
                        <Translation>Please select trait type first.</Translation>
                      </Message>
                    </If>
                  </Loading>
                </Card>
              </Col>
            </Row>
          </AwaitingType>
        </Form>
      </ModalWithFooter>
    );
  }
}

export default TraitDialog;
