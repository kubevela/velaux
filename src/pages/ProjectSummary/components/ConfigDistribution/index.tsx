import React, { Component, Fragment } from 'react';
import { Table, Button, Tag, Balloon, Icon } from '@b-design/ui';
import type { ConfigDistribution } from '../../../../interface/configs';
import Translation from '../../../../components/Translation';
import Permission from '../../../../components/Permission';
import locale from '../../../../utils/locale';
import { momentDate } from '../../../../utils/common';
import './index.less';
import { getProjectConfigDistributions } from '../../../../api/config';
import type { WorkflowStepStatus } from '../../../../interface/application';

type Props = {
  projectName: string;
};

type State = {
  distributions: ConfigDistribution[];
  isLoading: boolean;
};

class ConfigDistributionPage extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      distributions: [],
      isLoading: false,
    };
  }

  componentDidMount() {
    const { projectName } = this.props;
    this.listConfigDistributions(projectName);
  }

  shouldComponentUpdate(nextProps: Props) {
    const change = nextProps.projectName !== this.props.projectName;
    if (change) {
      this.listConfigDistributions(nextProps.projectName);
    }
    return true;
  }

  listConfigDistributions = async (projectName: string) => {
    this.setState({
      isLoading: true,
    });
    getProjectConfigDistributions({ projectName })
      .then((res) => {
        this.setState({
          distributions: res && Array.isArray(res.distributions) ? res.distributions : [],
        });
      })
      .finally(() => {
        this.setState({
          isLoading: false,
        });
      });
  };

  onDelete = (record: ConfigDistribution) => {
    console.log(record);
  };

  render() {
    const { projectName } = this.props;
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
        key: 'configs',
        title: <Translation>Configs</Translation>,
        dataIndex: 'configs',
        cell: (v: { name: string; namespace: string }[]) => {
          return (
            <div>
              {v.map((i) => {
                return (
                  <Tag>
                    {i.namespace}/{i.name}
                  </Tag>
                );
              })}
            </div>
          );
        },
      },
      {
        key: 'targets',
        title: <Translation>Targets</Translation>,
        dataIndex: 'targets',
        cell: (
          targets: { clusterName: string; namespace: string }[],
          i: number,
          record: ConfigDistribution,
        ) => {
          const targetStatus = new Map<string, WorkflowStepStatus>();
          record.status?.workflow?.steps?.map((step) => {
            if (step.name) {
              const target = step.name.split('-');
              if (target.length == 3 && target[0] == 'deploy') {
                targetStatus.set(step.name.replace('deploy-', ''), step);
              }
            }
          });
          return (
            <div>
              {targets.map((t) => {
                const step = targetStatus.get(`${t.clusterName}-${t.namespace}`);
                const tag = (
                  <Tag
                    animation={true}
                    color={
                      step?.phase === 'succeeded'
                        ? 'green'
                        : step?.phase === 'failed'
                        ? 'red'
                        : 'yellow'
                    }
                  >
                    {t.clusterName}/{t.namespace}
                  </Tag>
                );
                return step?.message ? <Balloon trigger={tag}>{step.message}</Balloon> : tag;
              })}
            </div>
          );
        },
      },
      {
        key: 'status',
        title: <Translation>Status</Translation>,
        dataIndex: 'status.status',
        cell: (v: string) => {
          if (v == 'running') {
            return (
              <span color="#28a745">
                <Translation>Completed</Translation>
              </span>
            );
          }
          return <span>{v}</span>;
        },
      },
      {
        key: 'createdTime',
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
        cell: (v: string, i: number, record: ConfigDistribution) => {
          return (
            <Fragment>
              <Permission
                request={{
                  resource: `project:${projectName}/config:${record.name}`,
                  action: 'delete',
                }}
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
    const { distributions, isLoading } = this.state;

    return (
      <Fragment>
        <div className="config-wrapper">
          <section className="card-title-wrapper">
            <span className="card-title">
              <Translation>Config Distributions</Translation>
            </span>
            <Button
              type="secondary"
              onClick={() => {
                this.listConfigDistributions(projectName);
              }}
              className="card-button-wrapper"
            >
              <Icon type="refresh" />
            </Button>
            {/* <Permission
              request={{ resource: `project/config:*`, action: 'create' }}
              project={projectName}
            >
              <Button className="card-button-wrapper">
                <Translation>Add</Translation>
              </Button>
            </Permission> */}
          </section>
          <section className="card-content-table">
            <Table
              locale={locale().Table}
              dataSource={distributions}
              hasBorder={true}
              loading={isLoading}
            >
              {columns.map((col, key) => (
                <Column {...col} key={key} align={'left'} />
              ))}
            </Table>
          </section>
        </div>
      </Fragment>
    );
  }
}

export default ConfigDistributionPage;
