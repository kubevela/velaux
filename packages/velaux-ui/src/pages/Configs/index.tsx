import { Table, Button, Dialog, Message } from '@alifd/next';
import { connect } from 'dva';
import React, { Component, Fragment } from 'react';

import { getConfigs, deleteConfig } from '../../api/config';
import { If } from '../../components/If';
import Permission from '../../components/Permission';
import { Translation } from '../../components/Translation';
import type { ConfigTemplate, Config , LoginUserInfo } from '@velaux/data';
import { momentDate } from '../../utils/common';
import { locale } from '../../utils/locale';
import { getMatchParamObj } from '../../utils/utils';
import './index.less';

import CreateConfigDialog from './components/CreateConfigDialog';
import { HiOutlineRefresh } from 'react-icons/hi';

type Props = {
  userInfo?: LoginUserInfo;
  configTemplates: ConfigTemplate[];
  match: {
    params: {
      templateName: string;
    };
  };
};

type State = {
  template: string;
  list: Config[];
  configName?: string;
  visible: boolean;
  isLoading: boolean;
};

@connect((store: any) => {
  return { ...store.configs, ...store.user };
})
class Configs extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      template: this.getTemplateName(),
      list: [],
      visible: false,
      isLoading: false,
    };
  }
  componentDidMount() {
    this.listConfigs();
  }

  componentWillReceiveProps(nextProps: Props) {
    const nextPropsParams = nextProps.match.params || {};
    if (nextPropsParams.templateName && nextPropsParams.templateName !== this.state.template) {
      this.setState(
        {
          template: nextPropsParams.templateName,
        },
        () => {
          this.listConfigs();
        }
      );
    }
  }

  listConfigs() {
    const { template } = this.state;
    if (!template) {
      return;
    }
    this.setState({ isLoading: true });
    getConfigs(template)
      .then((res) => {
        if (res) {
          this.setState({
            list: res.configs || [],
          });
        } else {
          this.setState({
            list: [],
          });
        }
      })
      .finally(() => {
        this.setState({ isLoading: false });
      });
  }

  getTemplateName = () => {
    return getMatchParamObj(this.props.match, 'templateName');
  };

  onDelete = (record: Config) => {
    Dialog.confirm({
      content: 'Are you sure want to delete this config',
      onOk: () => {
        const { name } = record;
        if (name) {
          deleteConfig(name).then((res) => {
            if (res) {
              Message.success(<Translation>Config deleted successfully</Translation>);
              this.listConfigs();
            }
          });
        }
      },
      locale: locale().Dialog,
    });
  };

  onSuccess = () => {
    this.setState({ visible: false, configName: '' });
    this.listConfigs();
  };

  onCloseCreate = () => {
    this.setState({ visible: false, configName: '' });
  };

  handleClickCreate = () => {
    this.setState({
      visible: true,
    });
  };

  onClick = (configName: string) => {
    this.setState({
      visible: true,
      configName: configName,
    });
  };

  render() {
    const columns = [
      {
        key: 'name',
        title: <Translation>Name(Alias)</Translation>,
        dataIndex: 'name',
        cell: (v: string, i: number, config: Config) => {
          const title = `${v}(${config.alias || '-'})`;
          if (config.sensitive) {
            return <span>{title}</span>;
          }
          return <a onClick={() => this.onClick(config.name)}>{title}</a>;
        },
      },
      {
        key: 'description',
        title: <Translation>Description</Translation>,
        dataIndex: 'description',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'createTime',
        title: <Translation>Create Time</Translation>,
        dataIndex: 'createdTime',
        cell: (v: string) => {
          return <span>{momentDate(v)}</span>;
        },
      },
      {
        key: 'operation',
        title: <Translation>Actions</Translation>,
        dataIndex: 'operation',
        cell: (v: string, i: number, record: Config) => {
          return (
            <Fragment>
              <Permission request={{ resource: `config:${record.name}`, action: 'delete' }} project={''}>
                <Button
                  text
                  size={'medium'}
                  component={'a'}
                  onClick={() => {
                    this.onDelete(record);
                  }}
                >
                  <Translation>Delete</Translation>
                </Button>
              </Permission>
            </Fragment>
          );
        },
      },
    ];

    const { Column } = Table;
    const { list, visible, isLoading, template, configName } = this.state;
    return (
      <div className="list-content">
        <div className="create-btn">
          <Button type="secondary" onClick={() => this.listConfigs()} style={{ marginRight: '16px' }}>
            <HiOutlineRefresh />
          </Button>
          <Permission request={{ resource: `config:*`, action: 'create' }} project={''}>
            <Button type="primary" onClick={this.handleClickCreate}>
              <Translation>New</Translation>
            </Button>
          </Permission>
        </div>
        <Table locale={locale().Table} dataSource={list} loading={isLoading}>
          {columns.map((col, key) => (
            <Column {...col} key={key} align={'left'} />
          ))}
        </Table>

        <If condition={visible && template}>
          <CreateConfigDialog
            visible={visible}
            configName={configName}
            template={{ name: template }}
            onSuccess={this.onSuccess}
            onClose={this.onCloseCreate}
          />
        </If>
      </div>
    );
  }
}

export default Configs;
