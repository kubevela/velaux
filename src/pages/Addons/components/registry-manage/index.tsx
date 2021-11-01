import React from 'react';
import {
  Button,
  Message,
  Grid,
  Dialog,
  Form,
  Input,
  Select,
  Table,
  Field,
  Icon,
} from '@b-design/ui';
import Translation from '../../../../components/Translation';
import { If } from 'tsx-control-statements/components';
import { checkName } from '../../../../utils/common';
import { createAddonRegistry } from '../../../../api/addons';
import { handleError } from '../../../../utils/errors';

const { Row, Col } = Grid;

type Props = {
  visible: boolean;
  onClose: () => void;
  syncRegistrys: () => void;
  registrys: [];
  dispatch: ({}) => {};
};

type State = {
  showAdd: boolean;
};

class RegistryManageDialog extends React.Component<Props, State> {
  field: Field;
  constructor(props: Props) {
    super(props);
    this.state = {
      showAdd: false,
    };
    this.field = new Field(this);
  }
  onClose = () => {
    this.props.onClose();
  };

  onOk = () => {
    const { syncRegistrys } = this.props;
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      createAddonRegistry(values)
        .then((res) => {
          console.log(res);
          Message.success(<Translation>add success</Translation>);
          this.setState({ showAdd: false });
          syncRegistrys();
        })
        .catch((err) => {
          handleError(err);
        });
    });
  };

  showAddRegistry = () => {
    this.setState({ showAdd: true });
  };

  render() {
    const { visible, registrys } = this.props;
    const { showAdd } = this.state;
    const init = this.field.init;
    const renderOper = () => {
      return (
        <a onClick={() => {}}>
          <Translation>Remove</Translation>
        </a>
      );
    };
    return (
      <div>
        <Dialog
          className="commonDialog"
          title={<Translation>Addon Registry Manage</Translation>}
          autoFocus={true}
          visible={visible}
          onOk={this.onOk}
          onCancel={this.onClose}
          onClose={this.onClose}
          footerActions={[]}
          footerAlign="center"
        >
          <Row>
            <Col>
              <div className="tableButton">
                <Button type="secondary" onClick={this.showAddRegistry}>
                  <Translation>Add</Translation>
                </Button>
              </div>
            </Col>
          </Row>
          <Table dataSource={registrys}>
            <Table.Column title={<Translation>Name</Translation>} dataIndex="name" />
            <Table.Column title={<Translation>URL</Translation>} dataIndex="git.url" />
            <Table.Column title={<Translation>Path</Translation>} dataIndex="git.path" />
            <Table.Column
              cell={renderOper}
              width="100px"
              title={<Translation>Actions</Translation>}
              dataIndex="name"
            />
          </Table>
          <If condition={showAdd}>
            <Form field={this.field}>
              <Row>
                <Col span={4} style={{ padding: '8px' }}>
                  <Form.Item label={<Translation>Name</Translation>} required>
                    <Input
                      {...init('name', {
                        rules: [
                          {
                            required: true,
                            pattern: checkName,
                            message: 'Please enter a valid name',
                          },
                        ],
                      })}
                    ></Input>
                  </Form.Item>
                </Col>
                <Col span={10} style={{ padding: '8px' }}>
                  <Form.Item
                    label={<Translation>URL</Translation>}
                    required
                    help="Only support github repo url（master branch）"
                  >
                    <Input
                      {...init('url', {
                        rules: [
                          {
                            required: true,
                            format: 'url',
                            message: 'Please enter a valid github repo url',
                          },
                        ],
                      })}
                    ></Input>
                  </Form.Item>
                </Col>
                <Col span={6} style={{ padding: '8px' }}>
                  <Form.Item
                    label={<Translation>Path</Translation>}
                    help="The addon path in the repo"
                  >
                    <Input
                      {...init('path', {
                        rules: [
                          {
                            max: 512,
                            message: 'The input string is too long',
                          },
                        ],
                      })}
                    ></Input>
                  </Form.Item>
                </Col>
                <Col span={4} style={{ padding: '43px 8px 8px 8px' }}>
                  <Button type="secondary" onClick={this.onOk}>
                    <Translation>Submit</Translation>
                  </Button>
                </Col>
              </Row>
            </Form>
          </If>
        </Dialog>
      </div>
    );
  }
}

export default RegistryManageDialog;
