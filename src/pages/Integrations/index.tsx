import React, { Component, Fragment } from 'react';
import { connect } from 'dva';
import { If } from 'tsx-control-statements/components';
import { Table, Button, Dialog, Message } from '@b-design/ui';
import CreateIntegration from './components/CreateIntegrationDialog';
import { getConfigs, deleteConfig } from '../../api/integration';
import type { LoginUserInfo } from '../../interface/user';
import type { IntegrationBase, IntegrationConfigs } from '../../interface/integrations';
import _ from 'lodash';
import Translation from '../../components/Translation';
import Permission from '../../components/Permission';
import locale from '../../utils/locale';
import { getMatchParamObj } from '../../utils/utils';
import { momentDate } from '../../utils/common';
import './index.less';

type Props = {
  userInfo?: LoginUserInfo;
  integrationsConfigTypes: IntegrationBase[];
  match: {
    params: {
      configType: string;
    };
  };
};

type State = {
  configType: string;
  list: [];
  visible: boolean;
  isLoading: boolean;
};

@connect((store: any) => {
  return { ...store.integrations, ...store.user };
})
class Integrations extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      configType: this.getConfigType(),
      list: [],
      visible: false,
      isLoading: false,
    };
  }
  componentDidMount() {
    this.listIntegrations();
  }

  componentWillReceiveProps(nextProps: Props) {
    const nextPropsParams = nextProps.match.params || {};
    if (nextPropsParams.configType !== this.state.configType) {
      this.setState(
        {
          configType: nextPropsParams.configType,
        },
        () => {
          this.listIntegrations();
        },
      );
    }
  }

  listIntegrations() {
    const { configType } = this.state;
    if (!configType) {
      return;
    }
    this.setState({ isLoading: true });
    getConfigs({ configType })
      .then((res) => {
        if (res) {
          this.setState({
            list: res,
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

  getConfigType = () => {
    return getMatchParamObj(this.props.match, 'configType');
  };

  onDelete = (record: IntegrationConfigs) => {
    Dialog.confirm({
      content: 'Are you sure you want to delete the config',
      onOk: () => {
        const { name } = record;
        const { configType } = this.state;
        const params = {
          name,
          configType,
        };
        if (params) {
          deleteConfig(params).then((res) => {
            if (res) {
              Message.success(<Translation>Integration config deleted successfully</Translation>);
              setTimeout(() => this.listIntegrations(), 2000);
            }
          });
        }
      },
      locale: locale().Dialog,
    });
  };

  onCreate = () => {
    this.setState({ visible: false });
    setTimeout(() => this.listIntegrations(), 2000);
  };

  onCloseCreate = () => {
    this.setState({ visible: false });
  };

  handleClickCreate = () => {
    this.setState({
      visible: true,
    });
  };

  getConfigTypeDefinitions() {
    const { integrationsConfigTypes } = this.props;
    const { configType } = this.state;
    const findDefinition = _.find(integrationsConfigTypes, (item) => {
      return item.name === configType;
    });
    const transData = ((findDefinition && findDefinition.definitions) || []).map((item: string) => {
      return { name: item };
    });
    return transData || [];
  }

  render() {
    const columns = [
      {
        key: 'name',
        title: <Translation>Name</Translation>,
        dataIndex: 'name',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'project',
        title: <Translation>Project</Translation>,
        dataIndex: 'project',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'status',
        title: <Translation>Status</Translation>,
        dataIndex: 'status',
        cell: (v: string) => {
          const enumStatusList = [
            { name: 'Ready', color: 'isReadyColor' },
            { name: 'Not ready', color: 'isNotReady' },
          ];
          const findStatus = _.find(enumStatusList, (item) => {
            return item.name === v;
          });
          const colorClass = (findStatus && findStatus.color) || '';
          return <span className={`${colorClass}`}>{v}</span>;
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
        cell: (v: string, i: number, record: IntegrationConfigs) => {
          return (
            <Fragment>
              <Permission
                request={{ resource: `configType/config:${record.name}`, action: 'delete' }}
                project={''}
              >
                <Button
                  text
                  size={'medium'}
                  ghost={true}
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
    const { userInfo } = this.props;
    const { list, visible, isLoading, configType } = this.state;
    return (
      <div className="list-content">
        <div className="create-btn">
          <Permission request={{ resource: `configType/config:*`, action: 'create' }} project={''}>
            <Button type="primary" onClick={this.handleClickCreate}>
              <Translation>New</Translation>
            </Button>
          </Permission>
        </div>
        <Table locale={locale().Table} dataSource={list} hasBorder={false} loading={isLoading}>
          {columns && columns.map((col, key) => <Column {...col} key={key} align={'left'} />)}
        </Table>

        <If condition={visible}>
          <CreateIntegration
            visible={visible}
            configType={configType}
            projects={userInfo?.projects || []}
            componentDefinitions={this.getConfigTypeDefinitions()}
            onCreate={this.onCreate}
            onClose={this.onCloseCreate}
          />
        </If>
      </div>
    );
  }
}

export default Integrations;
