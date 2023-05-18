import { Button, Message, Grid, Dialog, Form, Input, Table, Field, Select } from '@alifd/next';
import React from 'react';

import { createAddonRegistry, deleteAddonRegistry } from '../../../../api/addons';
import { If } from '../../../../components/If';
import Permission from '../../../../components/Permission';
import { Translation } from '../../../../components/Translation';
import type { AddonRegistry } from '@velaux/data';
import { checkName } from '../../../../utils/common';
import { handleError } from '../../../../utils/errors';
import { locale } from '../../../../utils/locale';

const { Row, Col } = Grid;

type Props = {
  visible: boolean;
  onClose: () => void;
  syncRegistries: () => void;
  registries: [];
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
    const { syncRegistries } = this.props;
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      const { name, type, url, path, token, repo } = values;
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
      if (type == 'Gitee') {
        params = {
          name: name,
          gitee: {
            url: url,
            path: path,
            token: token,
          },
        };
      }
      if (type == 'Gitlab') {
        params = {
          name: name,
          gitlab: {
            url: url,
            path: path,
            token: token,
            repo: repo,
          },
        };
      }
      if (type == 'Helm') {
        params = {
          name: name,
          helm: {
            url: url,
          },
        };
      }
      createAddonRegistry(params)
        .then(() => {
          Message.success(<Translation>add success</Translation>);
          this.setState({ showAdd: false });
          syncRegistries();
        })
        .catch((err) => {
          handleError(err);
        });
    });
  };

  onDeleteRegistry = (name: string) => {
    const { syncRegistries } = this.props;
    deleteAddonRegistry({ name: name }).then((re) => {
      if (re) {
        Message.success(<Translation>delete success</Translation>);
        syncRegistries();
      }
    });
  };

  showAddRegistry = () => {
    this.setState({ showAdd: true });
  };

  addExperimental = () => {
    const { syncRegistries } = this.props;
    createAddonRegistry({
      name: 'experimental',
      helm: {
        url: 'https://addons.kubevela.net/experimental',
      },
    })
      .then((res) => {
        if (res) {
          Message.success(<Translation>add success</Translation>);
          this.setState({ showAdd: false });
          syncRegistries();
        }
      })
      .catch((err) => {
        handleError(err);
      });
  };

  render() {
    const { visible, registries } = this.props;
    const { showAdd, selectType } = this.state;
    const init = this.field.init;
    const renderAction = (name: string) => {
      return (
        <Permission request={{ resource: `addonRegistry:${name}`, action: 'delete' }} project={''}>
          <a
            onClick={() => {
              Dialog.confirm({
                content: <Translation>Are you sure to delete?</Translation>,
                onOk: () => {
                  this.onDeleteRegistry(name);
                },
                locale: locale().Dialog,
              });
            }}
          >
            <Translation>Remove</Translation>
          </a>
        </Permission>
      );
    };
    let existExperimental = false;
    const registryDataSource = registries.map((item: AddonRegistry) => {
      if (item.name == 'experimental') {
        existExperimental = true;
      }
      const reItem = {
        name: item.name,
        url: '',
        path: '',
        type: '',
        repo: '',
      };
      if (item.git) {
        reItem.url = item.git.url;
        reItem.path = item.git.path;
        reItem.type = 'Github';
      }
      if (item.gitee) {
        reItem.url = item.git.url;
        reItem.path = item.git.path;
        reItem.type = 'Gitee';
      }
      if (item.gitlab) {
        reItem.url = item.gitlab.url;
        reItem.path = item.gitlab.path;
        reItem.repo = item.gitlab.repo;
        reItem.type = 'Gitlab';
      }
      if (item.oss) {
        reItem.url = item.oss.end_point;
        reItem.path = item.oss.bucket ? `${item.oss.bucket}/${item.oss.path}` : item.oss.path;
        reItem.type = 'OSS';
      }
      if (item.helm) {
        reItem.url = item.helm.url;
        reItem.type = 'Helm';
      }
      return reItem;
    });

    return (
      <div>
        <Dialog
          locale={locale().Dialog}
          title={<Translation>Registry Management</Translation>}
          autoFocus={true}
          overflowScroll={true}
          visible={visible}
          style={{ width: '1000px' }}
          onOk={this.onOk}
          onCancel={this.onClose}
          onClose={this.onClose}
          footerActions={[]}
          v2
        >
          <Row>
            <Col>
              <div className="tableButton">
                <If condition={!existExperimental}>
                  <Button type="secondary" onClick={this.addExperimental} style={{ marginRight: '16px' }}>
                    <Translation>Add Experimental Registry</Translation>
                  </Button>
                </If>
                <Permission request={{ resource: 'addonRegistry:*', action: 'create' }} project={''}>
                  <Button type="secondary" onClick={this.showAddRegistry}>
                    <Translation>New</Translation>
                  </Button>
                </Permission>
              </div>
            </Col>
          </Row>
          <Table locale={locale().Table} dataSource={registryDataSource}>
            <Table.Column width="150px" title={<Translation>Name</Translation>} dataIndex="name" />
            <Table.Column width="80px" title={<Translation>Type</Translation>} dataIndex="type" />
            <Table.Column title={<Translation>URL</Translation>} dataIndex="url" />
            {registryDataSource.find((item) => item.type === 'Gitlab') && (
              <Table.Column width="100px" title={<Translation>Repository Name</Translation>} dataIndex="repo" />
            )}
            <Table.Column width="160px" title={<Translation>Path(Bucket)</Translation>} dataIndex="path" />
            <Table.Column
              cell={renderAction}
              width="100px"
              align="left"
              title={<Translation>Actions</Translation>}
              dataIndex="name"
            />
          </Table>
          <If condition={showAdd}>
            <Form field={this.field}>
              <Row>
                <Col span={selectType === 'Gitlab' ? 3 : 4} style={{ padding: '8px' }}>
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
                <Col span={selectType === 'Gitlab' ? 3 : 4} style={{ padding: '8px' }}>
                  <Form.Item
                    label={<Translation>Type</Translation>}
                    help={<Translation>The addon registry type</Translation>}
                  >
                    <Select
                      locale={locale().Select}
                      {...init('type', {
                        rules: [
                          {
                            max: 512,
                            message: 'The input string is too long',
                          },
                        ],
                      })}
                    >
                      <Select.Option value="Helm">Helm Repository</Select.Option>
                      <Select.Option value="Github">Github</Select.Option>
                      <Select.Option value="Gitee">Gitee</Select.Option>
                      <Select.Option value="Gitlab">Gitlab</Select.Option>
                      <Select.Option value="OSS">Aliyun OSS</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={6} style={{ padding: '8px' }}>
                  <Form.Item label={<Translation>URL</Translation>} required>
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
                <If condition={selectType === 'Gitlab'}>
                  <Col span={3} style={{ padding: '8px' }}>
                    <Form.Item
                      label={<Translation>Repository Name</Translation>}
                      required
                      help="Repository name in gitlab"
                    >
                      <Input
                        {...init('repo', {
                          rules: [
                            {
                              required: true,
                              message: 'Please enter a repository name',
                            },
                          ],
                        })}
                      />
                    </Form.Item>
                  </Col>
                </If>
                <If condition={selectType === 'Github' || selectType === 'Gitee' || selectType === 'Gitlab'}>
                  <Col span={4} style={{ padding: '8px' }}>
                    <Form.Item label={<Translation>Path</Translation>} help="The addon path in the repo">
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
                  <Col span={selectType === 'Gitlab' ? 4 : 5} style={{ padding: '8px' }}>
                    <Form.Item label={<Translation>Token</Translation>} help="Github personal access token">
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
                    <Form.Item label={<Translation>Bucket</Translation>} help="The bucket path in the oss repo">
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
                  <Button size="small" type="secondary" onClick={this.onOk} style={{ height: '36px' }}>
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
