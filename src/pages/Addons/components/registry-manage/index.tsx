import React from 'react';
import { Button, Message, Grid, Dialog, Form, Input, Table, Field, Select } from '@b-design/ui';
import Translation from '../../../../components/Translation';
import { If } from 'tsx-control-statements/components';
import { checkName } from '../../../../utils/common';
import { createAddonRegistry, deleteAddonRegistry } from '../../../../api/addons';
import { handleError } from '../../../../utils/errors';
import type { AddonRegistry } from '../../../../interface/addon';
import locale from '../../../../utils/locale';

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
  selectType?: string;
};

class RegistryManageDialog extends React.Component<Props, State> {
  field: Field;
  constructor(props: Props) {
    super(props);
    this.state = {
      showAdd: false,
    };
    this.field = new Field(this, {
      onChange: (name: string, value: any) => {
        if (name == 'type') {
          this.setState({ selectType: value });
        }
      },
    });
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
      const { name, type, url, path, token } = values;
      let params: any = {};
      if (type == 'OSS') {
        params = {
          name: name,
          oss: {
            end_point: url,
            bucket: path,
          },
        };
      }
      if (type == 'Github') {
        params = {
          name: name,
          git: {
            url: url,
            path: path,
            token: token,
          },
        };
      }
      createAddonRegistry(params)
        .then(() => {
          Message.success(<Translation>add success</Translation>);
          this.setState({ showAdd: false });
          syncRegistrys();
        })
        .catch((err) => {
          handleError(err);
        });
    });
  };

  onDeleteRegistry = (name: string) => {
    const { syncRegistrys } = this.props;
    deleteAddonRegistry({ name: name }).then((re) => {
      if (re) {
        Message.success(<Translation>delete success</Translation>);
        syncRegistrys();
      }
    });
  };

  showAddRegistry = () => {
    this.setState({ showAdd: true });
  };

  render() {
    const { visible, registrys } = this.props;
    const { showAdd, selectType } = this.state;
    const init = this.field.init;
    const renderOper = (name: string) => {
      return (
        <a
          onClick={() => {
            Dialog.confirm({
              content: 'Are you sure you want to delete?',
              onOk: () => {
                this.onDeleteRegistry(name);
              },
              locale: locale.Dialog,
            });
          }}
        >
          <Translation>Remove</Translation>
        </a>
      );
    };
    const registryDataSorce = registrys.map((item: AddonRegistry) => {
      const reitem = {
        name: item.name,
        url: '',
        path: '',
        type: '',
      };
      if (item.git) {
        reitem.url = item.git.url;
        reitem.path = item.git.path;
        reitem.type = 'Github';
      }
      if (item.oss) {
        reitem.url = item.oss.end_point;
        reitem.path = item.oss.bucket;
        reitem.type = 'OSS';
      }
      return reitem;
    });
    return (
      <div>
        <Dialog
          locale={locale.Dialog}
          className="commonDialog"
          title={<Translation>Registry Management</Translation>}
          autoFocus={true}
          isFullScreen={true}
          visible={visible}
          style={{ width: '1000px' }}
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
                  <Translation>New</Translation>
                </Button>
              </div>
            </Col>
          </Row>
          <Table locale={locale.Table} dataSource={registryDataSorce}>
            <Table.Column width="100px" title={<Translation>Name</Translation>} dataIndex="name" />
            <Table.Column width="60px" title={<Translation>Type</Translation>} dataIndex="type" />
            <Table.Column title={<Translation>URL</Translation>} dataIndex="url" />
            <Table.Column
              width="160px"
              title={<Translation>Path(Bucket)</Translation>}
              dataIndex="path"
            />
            <Table.Column
              cell={renderOper}
              width="100px"
              align="left"
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
                    />
                  </Form.Item>
                </Col>
                <Col span={3} style={{ padding: '8px' }}>
                  <Form.Item label={<Translation>Type</Translation>} help="The addon registry type">
                    <Select
                      locale={locale.Select}
                      {...init('type', {
                        rules: [
                          {
                            max: 512,
                            message: 'The input string is too long',
                          },
                        ],
                      })}
                    >
                      <Select.Option value="Github">Github</Select.Option>
                      <Select.Option value="OSS">AliyunOSS</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={6} style={{ padding: '8px' }}>
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
                    />
                  </Form.Item>
                </Col>
                <If condition={selectType === 'Github'}>
                  <Col span={4} style={{ padding: '8px' }}>
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
                      />
                    </Form.Item>
                  </Col>
                  <Col span={5} style={{ padding: '8px' }}>
                    <Form.Item
                      label={<Translation>Token</Translation>}
                      help="Github Personal access token"
                    >
                      <Input
                        {...init('token', {
                          rules: [
                            {
                              max: 128,
                              message: 'The input string is too long',
                            },
                          ],
                        })}
                      />
                    </Form.Item>
                  </Col>
                </If>
                <If condition={selectType === 'OSS'}>
                  <Col span={4} style={{ padding: '8px' }}>
                    <Form.Item
                      label={<Translation>Bucket</Translation>}
                      help="The bucket path in the oss repo"
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
                      />
                    </Form.Item>
                  </Col>
                </If>
                <Col span={2} style={{ padding: '43px 8px 8px 8px' }}>
                  <Button
                    size="small"
                    type="secondary"
                    onClick={this.onOk}
                    style={{ height: '36px' }}
                  >
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
