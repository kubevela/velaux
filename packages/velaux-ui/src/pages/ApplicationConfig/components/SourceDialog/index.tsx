import { Card, Field, Form, Grid, Input, Loading, Message, Select, Button, Table } from '@alifd/next';
import type { Rule } from '@alifd/next/lib/field';
import React from 'react';
import { connect } from 'dva';

import { createSource, getExpressionEnv, setExpressionOptIn, updateSource } from '../../../../api/application';
import { detailSourceDefinition, getSourceDefinitions } from '../../../../api/definitions';
import DrawerWithFooter from '../../../../components/Drawer';
import { If } from '../../../../components/If';
import Permission from '../../../../components/Permission';
import { Translation } from '../../../../components/Translation';
import UISchema from '../../../../components/UISchema';
import type { ExpressionContext } from '../../../../components/UISchema';
import type { ExpressionEnv } from '../../../../extends/ExpressionEditor';
import i18n from '../../../../i18n';
import type { ApplicationSource, DefinitionBase, DefinitionDetail } from '@velaux/data';
import { locale } from '../../../../utils/locale';
import { deployNamespaces, isUsable } from '../../../../utils/restrictions';
import type { DeployTarget } from '../../../../utils/restrictions';
import { sourceBindingName, sourceFields, sourceNamePattern } from '../../../../utils/source';

const { Row, Col } = Grid;

// autoUpdateOption and autoUpdateValue map a binding's autoUpdate to the
// select's options and back: unset is "default", the controller's setting.
function autoUpdateOption(autoUpdate?: boolean): string {
  if (autoUpdate === undefined) {
    return 'default';
  }
  return autoUpdate ? 'on' : 'off';
}

function autoUpdateValue(option?: string): boolean | undefined {
  if (option === 'on') {
    return true;
  }
  return option === 'off' ? false : undefined;
}

type Props = {
  appName: string;
  project: string;
  source?: ApplicationSource;
  // envbinding are where the application deploys, whose namespaces a source
  // type's restrictions are checked against.
  envbinding?: DeployTarget[];
  onClose: () => void;
  onOK: () => void;
  dispatch?: ({}) => {};
};

type State = {
  definitions: DefinitionBase[];
  definition?: DefinitionDetail;
  loading: boolean;
  saving: boolean;
  expressionEnv?: ExpressionEnv;
};

@connect()
class SourceDialog extends React.Component<Props, State> {
  field: Field;
  uiSchemaRef: React.RefObject<UISchema>;
  // suggestedName is the binding the dialog last filled in from the type.
  suggestedName = '';

  constructor(props: Props) {
    super(props);
    this.state = { definitions: [], loading: false, saving: false };
    this.field = new Field(this, {
      onChange: (name: string, value: any) => {
        if (name === 'type') {
          // Name the binding after the type, unless one was typed by hand.
          const current = this.field.getValue<string>('name');
          if (!this.props.source && (!current || current === this.suggestedName)) {
            this.suggestedName = value ? sourceBindingName(value) : '';
            this.field.setValue('name', this.suggestedName);
          }
          this.field.remove('properties');
          this.setState({ definition: undefined }, () => this.loadDefinition(value));
        }
      },
    });
    this.uiSchemaRef = React.createRef();
  }

  componentDidMount() {
    const { dispatch, appName, project, source } = this.props;
    if (dispatch) {
      dispatch({ type: 'uischema/setAppName', payload: appName });
      dispatch({ type: 'uischema/setProject', payload: project });
    }
    this.loadExpressionEnv();
    const namespaces = deployNamespaces(this.props.envbinding);
    // Without a namespace to check, an unfiltered list offers types the webhook
    // then refuses.
    getSourceDefinitions(namespaces.length > 0 ? namespaces : undefined).then((res) => {
      if (res) {
        this.setState({ definitions: namespaces.length > 0 ? (res.definitions || []).filter(isUsable) : [] });
      }
    });
    if (source) {
      this.field.setValues({
        name: source.name,
        type: source.type,
        properties: source.properties,
        autoUpdate: autoUpdateOption(source.autoUpdate),
      });
      this.loadDefinition(source.type);
    }
  }

  // loadExpressionEnv reads what this source's properties may read: the context
  // and the sources declared before it, or every source when it is new.
  loadExpressionEnv = async () => {
    const { appName, source } = this.props;
    try {
      const env: ExpressionEnv = await getExpressionEnv(appName, 'source', source?.name);
      this.setState({ expressionEnv: env });
    } catch (e) {
      this.setState({ expressionEnv: undefined });
    }
  };

  setExpressionOptIn = async (on: boolean): Promise<boolean> => {
    try {
      await setExpressionOptIn(this.props.appName, on);
    } catch (e) {
      return false;
    }
    await this.loadExpressionEnv();
    return true;
  };

  expressionContext = (): ExpressionContext => ({
    appName: this.props.appName,
    surface: 'source',
    source: this.props.source?.name,
    env: this.state.expressionEnv,
    onOptIn: this.setExpressionOptIn,
  });

  loadDefinition = (type: string) => {
    if (!type) {
      return;
    }
    this.setState({ loading: true });
    detailSourceDefinition({ name: type })
      .then((res) => {
        if (res) {
          this.setState({ definition: res });
        }
      })
      .finally(() => this.setState({ loading: false }));
  };

  onSubmit = () => {
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { appName, source } = this.props;
      const { name, type, properties } = values;
      const autoUpdate = autoUpdateValue(values.autoUpdate);
      this.setState({ saving: true });
      const request = source
        ? updateSource(appName, source.name, { type, properties: JSON.stringify(properties || {}), autoUpdate })
        : createSource(appName, { name, type, properties: JSON.stringify(properties || {}), autoUpdate });
      request
        .then((res) => {
          if (res) {
            Message.success(source ? i18n.t('Source updated successfully') : i18n.t('Source added successfully'));
            this.props.onOK();
          }
        })
        .finally(() => this.setState({ saving: false }));
    });
  };

  render() {
    const { onClose, source, appName, project } = this.props;
    const { definitions, definition, loading, saving } = this.state;
    const init = this.field.init;
    const validator = (rule: Rule, value: any, callback: (error?: string) => void) => {
      // A source with no parameters renders no form, so there is nothing to
      // check; the callback must still run or the submit never completes.
      if (!this.uiSchemaRef.current) {
        callback();
        return;
      }
      this.uiSchemaRef.current.validate(callback);
    };
    const name = this.field.getValue<string>('name') || (source && source.name) || '<name>';
    const fields = sourceFields(name, definition?.outputSchema);
    return (
      <DrawerWithFooter
        title={source ? i18n.t('Update Source') : i18n.t('New Source')}
        placement="right"
        width={800}
        onClose={onClose}
        extButtons={
          <Permission
            request={{
              resource: `project:${project}/application:${appName}/source:*`,
              action: source ? 'update' : 'create',
            }}
            project={project}
          >
            <Button type="primary" onClick={this.onSubmit} loading={saving}>
              {source ? i18n.t('Update').toString() : i18n.t('Create').toString()}
            </Button>
          </Permission>
        }
      >
        <Form field={this.field}>
          <Card contentHeight="auto" title={i18n.t('Source').toString()}>
            <Row wrap={true}>
              <Col span={12} style={{ padding: '0 8px' }}>
                <Form.Item label={i18n.t('Source Type').toString()} required>
                  <Select
                    {...init('type', {
                      rules: [{ required: true, message: i18n.t('Please select the source type.').toString() }],
                    })}
                    locale={locale().Select}
                    dataSource={definitions.map((d) => ({ label: d.name, value: d.name }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12} style={{ padding: '0 8px' }}>
                <Form.Item label={i18n.t('Name').toString()} required>
                  <Input
                    {...init('name', {
                      rules: [
                        {
                          required: true,
                          pattern: sourceNamePattern,
                          message: i18n.t('Letters, digits and underscores, as in clusterInfo').toString(),
                        },
                      ],
                    })}
                    disabled={source != undefined}
                    locale={locale().Input}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row>
              <Col span={12} style={{ padding: '0 8px' }}>
                <Form.Item
                  label={i18n.t('Auto Update').toString()}
                  help={i18n.t('Whether a change to the value updates what reads it, without a new deploy').toString()}
                >
                  <Select
                    {...init('autoUpdate', { initValue: 'default' })}
                    locale={locale().Select}
                    dataSource={[
                      { label: i18n.t('Default: the cluster setting, held by a deploy').toString(), value: 'default' },
                      { label: i18n.t('On: refresh live').toString(), value: 'on' },
                      { label: i18n.t('Off: wait for the next deploy').toString(), value: 'off' },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>
            <If condition={definition?.description}>
              <Message type="help">{definition?.description}</Message>
            </If>
          </Card>
          <Loading visible={loading} style={{ width: '100%' }}>
            <Card contentHeight="auto" style={{ marginTop: '8px' }} title={i18n.t('Source Properties').toString()}>
              <If condition={definition && (definition.uiSchema || []).length === 0}>
                <Message type="notice">
                  <Translation>This source takes no parameters.</Translation>
                </Message>
              </If>
              <If condition={definition && (definition.uiSchema || []).length > 0}>
                <Form.Item required={true}>
                  <UISchema
                    key={definition?.name}
                    {...init('properties', {
                      rules: [{ validator: validator, message: i18n.t('Please check the properties of this source') }],
                    })}
                    uiSchema={definition?.uiSchema}
                    definition={{
                      type: 'source',
                      name: definition?.name || '',
                      description: definition?.description || '',
                    }}
                    ref={this.uiSchemaRef}
                    mode={source ? 'edit' : 'new'}
                    expressions={this.expressionContext()}
                  />
                </Form.Item>
              </If>
              <If condition={!definition}>
                <Message type="notice">
                  <Translation>Please select the source type first.</Translation>
                </Message>
              </If>
            </Card>
            <If condition={fields.length > 0}>
              <Card
                contentHeight="auto"
                style={{ marginTop: '8px' }}
                title={i18n.t('Readable Fields').toString()}
                subTitle={i18n.t('Properties read these with $( ) expressions').toString()}
              >
                <Table dataSource={fields} size="small" hasBorder={false} locale={locale().Table}>
                  <Table.Column
                    title={i18n.t('Expression').toString()}
                    dataIndex="path"
                    cell={(v: string) => <code>{`$(${v})`}</code>}
                  />
                  <Table.Column title={i18n.t('Type').toString()} dataIndex="type" width={140} />
                  <Table.Column title={i18n.t('Description').toString()} dataIndex="description" />
                </Table>
              </Card>
            </If>
          </Loading>
        </Form>
      </DrawerWithFooter>
    );
  }
}

export default SourceDialog;
