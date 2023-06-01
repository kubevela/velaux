import { Table, Button, Dialog, Message, Tag, Balloon } from '@alifd/next';
import React, { Component, Fragment } from 'react';

import { If } from '../../../../components/If';
import Permission from '../../../../components/Permission';
import { Translation } from '../../../../components/Translation';
import type { Config, TargetClusterStatus } from '@velaux/data';
import { momentDate } from '../../../../utils/common';
import { locale } from '../../../../utils/locale';
import './index.less';
import { deleteConfig, getProjectConfigs } from '../../../../api/config';
import CreateConfig from '../../../Configs/components/CreateConfigDialog';

import DistributeConfigDialog from './config-distribute';
import { HiOutlineRefresh } from 'react-icons/hi';

type Props = {
  projectName: string;
};

type State = {
  configs: Config[];
  isLoading: boolean;
  showConfig?: boolean;
  config?: Config;
  distribution?: Config;
};

class Configs extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      configs: [],
      isLoading: false,
    };
  }

  componentDidMount() {
    const { projectName } = this.props;
    this.listConfigs(projectName);
  }

  shouldComponentUpdate(nextProps: Props) {
    const change = nextProps.projectName !== this.props.projectName;
    if (change) {
      this.listConfigs(nextProps.projectName);
    }
    return true;
  }

  listConfigs = async (projectName: string) => {
    this.setState({
      isLoading: true,
    });
    getProjectConfigs({ projectName })
      .then((res) => {
        this.setState({
          configs: Array.isArray(res.configs) ? res.configs : [],
        });
      })
      .finally(() => {
        this.setState({
          isLoading: false,
        });
      });
  };

  onClick = (int: Config) => {
    this.setState({ showConfig: true, config: int });
  };

  onDelete = (record: Config) => {
    const { projectName } = this.props;
    Dialog.confirm({
      content: 'Are you sure want to delete this config',
      onOk: () => {
        const { name } = record;
        if (name) {
          deleteConfig(name, projectName).then((res) => {
            if (res) {
              Message.success(<Translation>Config deleted successfully</Translation>);
              this.listConfigs(projectName);
            }
          });
        }
      },
      locale: locale().Dialog,
    });
  };

  onDistribute = (record: Config) => {
    this.setState({ distribution: record });
  };

  render() {
    const { projectName } = this.props;
    const columns = [
      {
        key: 'name',
        title: <Translation>Name</Translation>,
        dataIndex: 'name',
        cell: (v: string, i: number, config: Config) => {
          const title = `${v}(${config.alias || '-'})`;
          if (config.sensitive || config.shared) {
            return <span>{title}</span>;
          }
          return <a onClick={() => this.onClick(config)}>{title}</a>;
        },
      },
      {
        key: 'template',
        title: <Translation>Template</Translation>,
        dataIndex: 'template.name',
      },
      {
        key: 'targets',
        title: <Translation>Distribution</Translation>,
        dataIndex: 'targets',
        cell: (targets?: TargetClusterStatus[]) => {
          return (
            <div>
              {targets?.map((t) => {
                const tag = (
                  <Tag
                    animation={true}
                    color={t.status === 'succeeded' ? 'green' : t.status === 'failed' ? 'red' : 'yellow'}
                  >
                    {t.clusterName}/{t.namespace}
                  </Tag>
                );
                return t.message ? <Balloon trigger={tag}>{t.message}</Balloon> : tag;
              })}
            </div>
          );
        },
      },
      {
        key: 'description',
        title: <Translation>Description</Translation>,
        dataIndex: 'description',
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
              <If condition={!record.shared}>
                <Permission
                  request={{
                    resource: `project:${projectName}/config:${record.name}`,
                    action: 'delete',
                  }}
                  project={projectName}
                >
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
              </If>
              <Permission
                request={{
                  resource: `project:${projectName}/config:${record.name}`,
                  action: 'distribute',
                }}
                project={projectName}
              >
                <Button
                  text
                  size={'medium'}
                  component={'a'}
                  onClick={() => {
                    this.onDistribute(record);
                  }}
                >
                  <Translation>Distribute</Translation>
                </Button>
              </Permission>
            </Fragment>
          );
        },
      },
    ];

    const { Column } = Table;
    const { configs, isLoading, showConfig, config, distribution } = this.state;

    return (
      <Fragment>
        <div className="config-wrapper">
          <section className="card-title-wrapper">
            <span className="card-title">
              <Translation>Configs</Translation>
            </span>
            <div>
              <Button
                type="secondary"
                onClick={() => {
                  this.listConfigs(projectName);
                }}
                className="card-button-wrapper"
              >
                <HiOutlineRefresh />
              </Button>
              <Permission
                request={{ resource: `project:${projectName}/config:*`, action: 'create' }}
                project={projectName}
              >
                <Button
                  onClick={() => {
                    this.setState({ showConfig: true });
                  }}
                  type="secondary"
                  className="card-button-wrapper"
                >
                  <Translation>Add</Translation>
                </Button>
              </Permission>
            </div>
          </section>
          <section className="card-content-table">
            <Table locale={locale().Table} dataSource={configs} hasBorder={true} loading={isLoading}>
              {columns.map((col, key) => (
                <Column {...col} key={key} align={'left'} />
              ))}
            </Table>
          </section>
        </div>
        <If condition={showConfig}>
          <CreateConfig
            onSuccess={() => {
              this.listConfigs(projectName);
              this.setState({ showConfig: false, config: undefined });
            }}
            onClose={() => {
              this.setState({ showConfig: false, config: undefined });
            }}
            configName={config?.name}
            project={projectName}
            template={config?.template}
            visible={true}
          />
        </If>
        <If condition={distribution}>
          {distribution && (
            <DistributeConfigDialog
              config={distribution}
              onClose={() => {
                this.setState({ distribution: undefined });
              }}
              onSuccess={() => {
                this.listConfigs(projectName);
                this.setState({ distribution: undefined });
              }}
              targets={distribution?.targets}
              projectName={projectName}
            />
          )}
        </If>
      </Fragment>
    );
  }
}

export default Configs;
