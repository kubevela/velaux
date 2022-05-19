import React from 'react';
import { Grid, Field, Form, Button, Input, Select } from '@b-design/ui';
import type { Rule } from '@alifd/field';
import { withTranslation } from 'react-i18next';
import { detailPolicyDefinition, getPolicyDetail } from '../../../../api/application';
import type { DefinitionDetail, ApplicationPolicyDetail } from '../../../../interface/application';
import UISchema from '../../../../components/UISchema';
import DrawerWithFooter from '../../../../components/Drawer';
import Translation from '../../../../components/Translation';
import { checkName } from '../../../../utils/common';
import Title from '../../../../components/Title';
import { Link } from 'dva/router';
import locale from '../../../../utils/locale';
import { If } from 'tsx-control-statements/components';
import i18n from '../../../../i18n';
import './index.less';
import Group from '../../../../extends/Group';
import { connect } from 'dva';
import type { DefinitionBase } from '../../../../interface/definitions';

type Props = {
  appName: string;
  project: string;
  policyName?: string;
  dispatch?: ({}) => {};
  onClose: () => void;
};

type State = {
  definitionDetail?: DefinitionDetail;
  policyDefinitions: DefinitionBase[];
  loading: boolean;
  isSubmitPolicyLoading: boolean;
  policy?: ApplicationPolicyDetail;
};

@connect()
class PolicyDialog extends React.Component<Props, State> {
  field: Field;
  uiSchemaRef: React.RefObject<UISchema>;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.state = {
      loading: true,
      policyDefinitions: [],
      isSubmitPolicyLoading: false,
    };
    this.uiSchemaRef = React.createRef();
  }

  componentDidMount() {
    const { policyName, dispatch, appName, project } = this.props;
    if (policyName) {
      this.onGetEditPolicyInfo(() => {
        if (dispatch) {
          dispatch({
            type: 'uischema/setAppName',
            payload: appName,
          });
          dispatch({
            type: 'uischema/setProject',
            payload: project,
          });
        }
      });
    } else {
      const getInitPolicyType: string = this.field.getValue('type') || '';
      this.onDetailsPolicyDefinition(getInitPolicyType);
    }
  }

  onGetEditPolicyInfo(callback?: () => void) {
    const { appName, policyName } = this.props;
    if (!policyName) {
      return;
    }
    const params = {
      appName,
      policyName,
    };
    this.setState({ loading: true });
    getPolicyDetail(params).then((res: ApplicationPolicyDetail) => {
      if (res) {
        this.setState(
          {
            policy: res,
            loading: false,
          },
          callback,
        );
      }
    });
  }

  onSubmitCreate = () => {
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      console.log(values);
    });
  };

  onDetailsPolicyDefinition = (value: string, callback?: () => void) => {
    detailPolicyDefinition({ name: value })
      .then((re) => {
        if (re) {
          this.setState({ definitionDetail: re, loading: false });
          if (callback) {
            callback();
          }
        }
      })
      .catch();
  };

  extButtonList = () => {
    const { onClose } = this.props;
    const { isSubmitPolicyLoading } = this.state;
    return (
      <div>
        <Button type="secondary" onClick={onClose} className="margin-right-10">
          {i18n.t('Cancel')}
        </Button>
        <Button type="primary" onClick={this.onSubmitCreate} loading={isSubmitPolicyLoading}>
          {i18n.t('Confirm')}
        </Button>
      </div>
    );
  };

  generateTitle = () => {
    const { policy } = this.state;
    if (policy) {
      const { name = '', alias = '' } = policy;
      return (
        <div>
          <span>{alias ? `${alias}(${name})` : name}</span>
        </div>
      );
    } else {
      return (
        <div>
          <span>{i18n.t('New Policy')} </span>
        </div>
      );
    }
  };

  render() {
    const init = this.field.init;
    const FormItem = Form.Item;
    const { Row, Col } = Grid;
    const { onClose, policyName } = this.props;
    const { definitionDetail, loading, policyDefinitions } = this.state;
    const validator = (rule: Rule, value: any, callback: (error?: string) => void) => {
      this.uiSchemaRef.current?.validate(callback);
    };

    const isEditPolicy = policyName && policyName != '';

    return (
      <DrawerWithFooter
        title={this.generateTitle()}
        placement="right"
        width={800}
        onClose={onClose}
        extButtons={this.extButtonList()}
      >
        <Form field={this.field} className="basic-config-wrapper">
          <section className="title">
            <Title title={i18n.t('Component Config')} actions={[]} />
          </section>
          <Group
            hasToggleIcon={true}
            initClose={isEditPolicy ? true : false}
            required={true}
            loading={loading}
            title={i18n.t('Component Basic Info')}
          >
            <Row>
              <Col span={12} style={{ paddingRight: '8px' }}>
                <FormItem
                  label={
                    <Translation className="font-size-14 font-weight-bold color333">
                      Name
                    </Translation>
                  }
                  labelTextAlign="left"
                  required={true}
                >
                  <Input
                    name="name"
                    maxLength={32}
                    disabled={isEditPolicy ? true : false}
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
                  label={
                    <Translation className="font-size-14 font-weight-bold color333">
                      Type
                    </Translation>
                  }
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
                    disabled={isEditPolicy ? true : false}
                    className="select"
                    {...init(`type`, {
                      initValue: isEditPolicy,
                      rules: [
                        {
                          required: true,
                          message: i18n.t('Please select'),
                        },
                      ],
                    })}
                    dataSource={policyDefinitions}
                    onChange={(item: string) => {
                      this.onDetailsPolicyDefinition(item, () => {
                        this.field.setValue('type', item);
                      });
                    }}
                  />
                </FormItem>
              </Col>
            </Row>
          </Group>
          <Row>
            <If condition={definitionDetail && definitionDetail.uiSchema}>
              <UISchema
                {...init(`properties`, {
                  rules: [
                    {
                      validator: validator,
                      message: i18n.t('Please check the component properties'),
                    },
                  ],
                })}
                uiSchema={definitionDetail && definitionDetail.uiSchema}
                ref={this.uiSchemaRef}
                mode={isEditPolicy ? 'edit' : 'new'}
              />
            </If>
          </Row>
        </Form>
      </DrawerWithFooter>
    );
  }
}

export default withTranslation()(PolicyDialog);
