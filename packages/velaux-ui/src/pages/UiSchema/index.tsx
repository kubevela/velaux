import type { Rule } from '@alifd/field';
import { Message, Field, Grid, Button, Loading, Card } from '@alifd/next';
import * as yaml from 'js-yaml';
import _ from 'lodash';
import React, { Component, Fragment } from 'react';
import { AiOutlineQuestionCircle } from 'react-icons/ai';

import { detailDefinition, updateUISchema } from '../../api/definitions';
import DefinitionCode from '../../components/DefinitionCode';
import Empty from '../../components/Empty';
import { If } from '../../components/If';
import Permission from '../../components/Permission';
import { Translation } from '../../components/Translation';
import UISchema from '../../components/UISchema';
import i18n from '../../i18n';
import type { UIParam } from '@velaux/data';
import { locale } from '../../utils/locale';

import './index.less';

type Props = {
  match: {
    params: {
      definitionName: string;
      definitionType: string;
    };
  };
};

type State = {
  isLoading: boolean;
  definitionName: string;
  definitionType: string;
  uiSchema?: UIParam[];
  updateUISchemaLoading: boolean;
};

class UiSchema extends Component<Props, State> {
  field: Field;
  uiSchemaRef: React.RefObject<UISchema>;
  DefinitionCodeRef: React.RefObject<DefinitionCode>;
  constructor(props: Props) {
    super(props);
    this.state = {
      definitionName: this.getDefinitionName(),
      definitionType: this.getDefinitionType(),
      isLoading: false,
      updateUISchemaLoading: false,
    };

    this.field = new Field(this);
    this.uiSchemaRef = React.createRef();
    this.DefinitionCodeRef = React.createRef();
  }

  componentDidMount() {
    this.getUISchemaDefinition();
  }

  getUISchemaDefinition = async () => {
    const { definitionName, definitionType } = this.state;
    const params = {
      name: definitionName,
      type: definitionType,
    };
    this.setState({ isLoading: true });
    detailDefinition(params)
      .then((res) => {
        if (res && res.uiSchema) {
          this.setState({
            uiSchema: res.uiSchema,
          });
          this.setYamlValues(res.uiSchema);
        } else {
          this.setState({
            uiSchema: [],
          });
          this.setYamlValues(undefined);
        }
      })
      .finally(() => {
        this.setState({
          isLoading: false,
        });
      });
  };

  setYamlValues = (value: UIParam[] | undefined) => {
    if (value) {
      try {
        const yamlValues = yaml.dump(value);
        this.field.setValues({ yamlValues });
      } catch {}
    } else {
      this.field.setValues({ yamlValues: '' });
    }
  };

  getDefinitionName = () => {
    const { params = { definitionName: '' } } = this.props.match;
    return params.definitionName || '';
  };
  getDefinitionType = () => {
    const { params = { definitionType: '' } } = this.props.match;
    return params.definitionType || '';
  };

  updateUISchema = () => {
    const { definitionName, definitionType, uiSchema } = this.state;
    const params = {
      name: definitionName,
      definitionType,
      uiSchema,
    };
    this.setState({ updateUISchemaLoading: true });
    updateUISchema(params)
      .then((res) => {
        if (res) {
          Message.success(i18n.t('UI schema updated successfully'));
        }
      })
      .finally(() => {
        this.setState({ updateUISchemaLoading: false });
      });
  };

  getYamlHeight = () => {
    const eleUiSchema = document.getElementById('view-ui-schema');
    if (eleUiSchema) {
      return eleUiSchema.clientHeight + 'px';
    } else {
      return '600px';
    }
  };

  onChangeYaml = (value: string) => {
    try {
      let object = yaml.load(value) as UIParam[];
      if (object && !(object instanceof Array)) {
        object = [object];
      }
      this.setState(
        {
          uiSchema: undefined,
        },
        () => {
          this.setState({
            uiSchema: object,
          });
        }
      );
    } catch {}
  };

  sortUISchema = (uiSchema: UIParam[] | undefined) => {
    if (uiSchema && uiSchema.length !== 0) {
      return _.sortBy(uiSchema, (item) => {
        return item.sort;
      });
    } else {
      return uiSchema;
    }
  };

  render() {
    const { Row, Col } = Grid;
    const { uiSchema, definitionName, isLoading, updateUISchemaLoading } = this.state;
    const init = this.field.init;
    const validator = (rule: Rule, value: any, callback: (error?: string) => void) => {
      this.uiSchemaRef.current?.validate(callback);
    };
    const yamlHeight = this.getYamlHeight();
    return (
      <Fragment>
        <div className="uiSchema-wrapper">
          <Loading visible={isLoading} inline={false}>
            <If condition={!uiSchema || uiSchema.length === 0}>
              <Card locale={locale().Card}>
                <Empty message={<Translation>There is no ui schema definition</Translation>} iconWidth={'30px'} />
              </Card>
            </If>
            <If condition={!uiSchema || uiSchema.length !== 0}>
              <section className="margin-top-20" style={{ maxWidth: '1520px', margin: '16px auto' }}>
                <Message type="notice" style={{ margin: '0 8px 8px 16px' }}>
                  <Translation>
                    Custom the UI schema will preview in right, please refer to the document to get more info
                  </Translation>
                  <a
                    style={{ marginLeft: '8px' }}
                    target="_blank"
                    href="https://kubevela.net/docs/reference/ui-schema"
                    rel="noopener noreferrer"
                  >
                    <AiOutlineQuestionCircle size={16} />
                  </a>
                </Message>
                <Row>
                  <Col span="12" className="padding-left-10 padding-right-10">
                    <Card
                      locale={locale().Card}
                      contentHeight="auto"
                      id="yaml-code"
                      className="yaml-code"
                      style={{ height: yamlHeight }}
                    >
                      <DefinitionCode
                        containerId="yaml-code"
                        language={'yaml'}
                        readOnly={false}
                        {...init('yamlValues')}
                        ref={this.DefinitionCodeRef}
                        onChange={this.onChangeYaml}
                      />
                    </Card>
                  </Col>
                  <Col span="12" className="padding-left-10 padding-right-10">
                    <If condition={uiSchema && uiSchema.length !== 0}>
                      <div id="view-ui-schema">
                        <div className="preview">
                          <span>
                            <Translation>Preview</Translation>
                          </span>
                        </div>
                        <Card locale={locale().Card} contentHeight="auto" className="view-ui-schema">
                          <UISchema
                            {...init(`properties`, {
                              rules: [
                                {
                                  validator: validator,
                                  message: 'Please check UI Schema properties',
                                },
                              ],
                            })}
                            uiSchema={this.sortUISchema(uiSchema)}
                            ref={this.uiSchemaRef}
                            advanced={true}
                            value={{}}
                            mode="edit"
                          />
                        </Card>
                      </div>
                    </If>
                  </Col>
                </Row>
              </section>
              <section className="margin-top-20 text-align-center">
                <Permission
                  request={{
                    resource: `definition:${definitionName}`,
                    action: 'update',
                  }}
                  project={''}
                >
                  <Button type="primary" loading={updateUISchemaLoading} onClick={this.updateUISchema}>
                    <Translation>Save & Online</Translation>
                  </Button>
                </Permission>
              </section>
            </If>
          </Loading>
        </div>
      </Fragment>
    );
  }
}

export default UiSchema;
