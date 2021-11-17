
import React from 'react';
import { Grid, Field, Form, Select, Message, Button, Input, Loading } from '@b-design/ui';
import { withTranslation } from 'react-i18next';
import Group from '../../../../extends/Group';
import { If } from 'tsx-control-statements/components';
import { createTrait, detailTraitDefinition } from '../../../../api/application';
import { DefinitionDetail, Trait } from '../../../../interface/application';
import UISchema from '../../../../components/UISchema';
import DrawerWithFooter from '../../../../components/Drawer';
import Translation from '../../../../components/Translation';

type Props = {
  isEditTrait: boolean;
  visible: boolean;
  traitItem?: Trait;
  traitDefinitions?: [];
  appName?: string;
  componentName?: string;
  onOK: () => void;
  onClose: () => void;
  dispatch?: ({ }) => {};
  t: (key: string) => {};
};

type State = {
  definitionDetail?: DefinitionDetail;
  definitionLoading: boolean;
};

class TraitDialog extends React.Component<Props, State> {
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
    const { isEditTrait, traitItem, traitDefinitions = [] } = this.props;
    if (isEditTrait && traitItem) {
      const { name, alias, type = '', description, properties } = traitItem;
      this.field.setValues({
        name,
        alias,
        type,
        description,
        properties,
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
      const { appName = '', componentName = '' } = this.props;
      debugger;
      const { alias = '', type = '', description = '', properties = '' } = values;
      const query = { appName, componentName };
      const params: Trait = {
        alias,
        type,
        description,
        properties,
      };
      this.uiSchemaRef.current?.validate((error: any, values: any) => {
        if (error) {
          return;
        }
        params.properties = JSON.stringify(values);
        createTrait(params, query).then((res) => {
          if (res) {
            Message.success(<Translation>create application success</Translation>);
            this.props.onOK();
          }
        });
      });
    });
  };

  transTraitDefinitions() {
    const { traitDefinitions } = this.props;
    return (traitDefinitions || []).map((item: { name: string }) => ({
      lable: item.name,
      value: item.name,
    }));
  }

  onDetailsComponeDefinition = (value: string, callback?: () => void) => {
    this.setState({ definitionLoading: true })
    detailTraitDefinition({ name: value }).then((re) => {
      if (re) {
        this.setState({ definitionDetail: re, definitionLoading: false });
        if (callback) {
          callback();
        }
      }
    }).catch(err => this.setState({ definitionLoading: false }));
  };

  handleChang = (value: string) => {
    this.onDetailsComponeDefinition(value);
    this.field.setValues({ type: value })
  }

  extButtonList = () => {
    const { onClose } = this.props;
    return (
      <div>
        <Button type="secondary" onClick={onClose} className="margin-right-10">
          <Translation>Cancle</Translation>
        </Button>
        <Button type="primary" onClick={this.onSubmit}>
          <Translation>Create</Translation>
        </Button>
      </div>
    );
  };

  render() {
    const init = this.field.init;
    const FormItem = Form.Item;
    const { Row, Col } = Grid;

    const { onClose } = this.props;
    const { t, isEditTrait } = this.props;
    const { definitionDetail, definitionLoading } = this.state;

    return (
      <DrawerWithFooter
        title={isEditTrait ? t('Edit Trait') : t('Add Trait')}
        placement="right"
        width={800}
        onClose={onClose}
        extButtons={this.extButtonList()}
      >
        <Form field={this.field}>
          <Row>
            <Col span={24} style={{ padding: '0 8px' }}>
              <FormItem label={<Translation>Trait Type</Translation>} required>
                <Select
                  className="select"
                  placeholder={t('Please chose').toString()}
                  {...init(`type`, {
                    rules: [
                      {
                        required: true,
                        message: 'Please chose',
                      },
                    ],
                  })}
                  dataSource={this.transTraitDefinitions()}
                  onChange={this.handleChang}

                />
              </FormItem>
            </Col>
          </Row>
          <Row>
            <Col span={12} style={{ padding: '0 8px' }}>
              <FormItem label={<Translation>Alias</Translation>} required>
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

            <Col span={12} style={{ padding: '0 8px' }}>
              <FormItem label={<Translation>Description</Translation>} required>
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
          <If condition={definitionDetail && definitionDetail.uiSchema}>
            <Group
              title=""
              description=""
              loading={definitionLoading}
            >
              <UISchema
                _key="body.properties"
                uiSchema={definitionDetail && definitionDetail.uiSchema}
                ref={this.uiSchemaRef}
              ></UISchema>
            </Group>
          </If>
        </Form>
      </DrawerWithFooter>
    );
  }
}

export default withTranslation()(TraitDialog);

