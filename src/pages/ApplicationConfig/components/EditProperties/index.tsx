import React from 'react';
import { Grid, Field, Form, Button, Message, Loading } from '@b-design/ui';
import type { Rule } from '@alifd/field';
import { If } from 'tsx-control-statements/components';
import { detailComponentDefinition, updateComponentProperties } from '../../../../api/application';
import type {
  ApplicationDetail,
  DefinitionDetail,
  UpdateComponentProperties,
  ApplicationComponent,
  EnvBinding,
} from '../../../../interface/application';
import UISchema from '../../../../components/UISchema';
import DrawerWithFooter from '../../../../components/Drawer';
import Translation from '../../../../components/Translation';

type Props = {
  onOK: () => void;
  onClose: () => void;
  dispatch?: ({}) => {};
  component?: ApplicationComponent;
  applicationDetail?: ApplicationDetail;
  defaultEnv?: EnvBinding;
};

type State = {
  definitionDetail?: DefinitionDetail;
  definitionLoading: boolean;
};

class EditProperties extends React.Component<Props, State> {
  field: Field;
  uiSchemaRef: React.RefObject<UISchema>;
  constructor(props: Props) {
    super(props);
    this.state = {
      definitionLoading: false,
    };
    this.field = new Field(this);
    this.uiSchemaRef = React.createRef();
  }

  componentDidMount() {
    const { component } = this.props;
    if (component) {
      this.field.setValues({
        properties: component.properties,
      });
      this.onDetailComponentDefinition(component.type);
    }
    this.setUISchemaContext();
  }

  setUISchemaContext() {
    const { dispatch, applicationDetail, defaultEnv } = this.props;
    if (dispatch) {
      dispatch({
        type: 'uischema/setAppName',
        payload: applicationDetail?.name,
      });
      dispatch({
        type: 'uischema/setAppNamespace',
        payload: defaultEnv?.appDeployNamespace,
      });
    }
  }

  onClose = () => {
    this.props.onClose();
  };

  onSubmit = () => {
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { properties } = values;
      const { component, applicationDetail, onOK } = this.props;
      const params: UpdateComponentProperties = {
        properties: JSON.stringify(properties),
        appName: applicationDetail?.name,
        componentName: component?.name,
      };
      updateComponentProperties(params).then((re) => {
        if (re) {
          Message.success({
            duration: 4000,
            title: 'Component properties update success.',
            content: 'You need to re-execute the workflow for it to take effect.',
          });
          onOK();
        }
      });
    });
  };

  onDetailComponentDefinition = (value?: string) => {
    if (value) {
      this.setState({ definitionLoading: true });
      detailComponentDefinition({ name: value })
        .then((re) => {
          if (re) {
            this.setState({ definitionDetail: re, definitionLoading: false });
          }
        })
        .catch(() => this.setState({ definitionLoading: false }));
    }
  };

  extButtonList = () => {
    const { onClose } = this.props;
    return (
      <div>
        <Button type="secondary" onClick={onClose} className="margin-right-10">
          <Translation>Cancel</Translation>
        </Button>
        <Button type="primary" onClick={this.onSubmit}>
          <Translation>Submit</Translation>
        </Button>
      </div>
    );
  };

  render() {
    const init = this.field.init;
    const FormItem = Form.Item;
    const { Row, Col } = Grid;

    const { onClose } = this.props;
    const { definitionDetail, definitionLoading } = this.state;
    const validator = (rule: Rule, value: any, callback: (error?: string) => void) => {
      this.uiSchemaRef.current?.validate(callback);
    };

    return (
      <DrawerWithFooter
        title={<Translation>Edit Component Properties</Translation>}
        placement="right"
        width={800}
        onClose={onClose}
        extButtons={this.extButtonList()}
      >
        <Form field={this.field}>
          <Row>
            <Col span={24} style={{ padding: '0 8px' }}>
              <Loading visible={definitionLoading} style={{ width: '100%' }}>
                <If condition={definitionDetail && definitionDetail.uiSchema}>
                  <FormItem required={true}>
                    <UISchema
                      {...init(`properties`, {
                        rules: [
                          {
                            validator: validator,
                            message: 'Please check component deploy properties',
                          },
                        ],
                      })}
                      uiSchema={definitionDetail && definitionDetail.uiSchema}
                      ref={this.uiSchemaRef}
                      mode="edit"
                    />
                  </FormItem>
                </If>
              </Loading>
            </Col>
          </Row>
        </Form>
      </DrawerWithFooter>
    );
  }
}

export default EditProperties;
