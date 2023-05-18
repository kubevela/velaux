import { Grid, Field, Form, Message, Button, Input } from '@alifd/next';
import i18n from 'i18next';
import React from 'react';

import { updateApplication } from '../../../../api/application';
import DrawerWithFooter from '../../../../components/Drawer';
import { Translation } from '../../../../components/Translation';
import KV from '../../../../extends/KV';
import type { ApplicationBase } from '@velaux/data';

type Props = {
  editItem?: ApplicationBase;
  onClose: () => void;
  onOK: () => void;
};

class EditAppDialog extends React.Component<Props> {
  field: Field;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
  }

  onSubmit = () => {
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { description, alias, labels, annotations } = values;
      const { editItem } = this.props;
      if (editItem) {
        const params = {
          name: editItem.name,
          alias,
          description,
          labels,
          annotations,
        };

        updateApplication(params).then((res) => {
          if (res) {
            Message.success(<Translation>Application updated successfully</Translation>);
            this.props.onOK();
          }
        });
      }
    });
  };

  extButtonList = () => {
    const { onClose } = this.props;
    return (
      <div>
        <Button type="secondary" onClick={onClose} className="margin-right-10">
          <Translation>Cancel</Translation>
        </Button>
        <Button type="primary" onClick={this.onSubmit}>
          <Translation>Update</Translation>
        </Button>
      </div>
    );
  };

  render() {
    const init = this.field.init;
    const FormItem = Form.Item;
    const { Row, Col } = Grid;
    const { editItem, onClose } = this.props;
    return (
      <DrawerWithFooter
        title={<Translation>Edit Application</Translation>}
        placement="right"
        width={800}
        onClose={onClose}
        extButtons={this.extButtonList()}
      >
        {editItem && (
          <Form field={this.field}>
            <Row>
              <Col span={24} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Alias</Translation>}>
                  <Input
                    name="alias"
                    placeholder={i18n.t('Give your app a more recognizable name').toString()}
                    {...init('alias', {
                      initValue: editItem?.alias,
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
              <Col span={24} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Description</Translation>}>
                  <Input
                    name="description"
                    {...init('description', {
                      initValue: editItem?.description,
                      rules: [
                        {
                          maxLength: 128,
                          message: 'Enter a description less than 128 characters.',
                        },
                      ],
                    })}
                  />
                </FormItem>
              </Col>
            </Row>
            <Row>
              <Col span={24} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Labels</Translation>}>
                  <KV
                    {...init('labels', {
                      initValue: editItem?.labels,
                    })}
                    disabled={false}
                  />
                </FormItem>
              </Col>
            </Row>
            <Row>
              <Col span={24} style={{ padding: '0 8px' }}>
                <FormItem label={<Translation>Annotations</Translation>}>
                  <KV
                    {...init('annotations', {
                      initValue: editItem?.annotations,
                    })}
                    disabled={false}
                  />
                </FormItem>
              </Col>
            </Row>
          </Form>
        )}
      </DrawerWithFooter>
    );
  }
}

export default EditAppDialog;
