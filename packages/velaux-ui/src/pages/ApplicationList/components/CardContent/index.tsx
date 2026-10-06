import { connect } from 'dva';
import React from 'react';
import { RowAction } from '../../../../components/RowAction';
import './index.less';
import { Link } from 'dva/router';
import { Menu, Dropdown, Dialog, Button, Table, Tag, Icon } from '@alifd/next';
import moment from 'moment';
import {
  AiFillDelete,
  AiFillSetting,
  AiOutlineAppstore,
  AiOutlineDelete,
  AiOutlineEdit,
  AiOutlineMore,
} from 'react-icons/ai';

import type { ShowMode } from '../..';
import Empty from '../../../../components/Empty';
import { If } from '../../../../components/If';
import Permission from '../../../../components/Permission';
import { Translation } from '../../../../components/Translation';
import type { ApplicationBase, ApplicationStatusSummary, Project, LoginUserInfo } from '@velaux/data';
import { ComponentHealth, EnvHealth, HealthBadge, WorkflowBadge } from '../AppStatus';
import { healthOf, workflowLabel } from '../AppStatus/health';
import { momentDate } from '../../../../utils/common';
import { locale } from '../../../../utils/locale';
import { checkPermission } from '../../../../utils/permission';
const { Column } = Table;

type State = {
  extendDotVisible: boolean;
  choseIndex: number;
  showLabelMode: Map<string, boolean>;
};

type Props = {
  applications?: ApplicationBase[];
  userInfo?: LoginUserInfo;
  projectName?: string;
  editAppPlan: (item: ApplicationBase) => void;
  deleteAppPlan: (name: string) => void;
  setVisible: (visible: boolean) => void;
  clickLabelFilter?: (label: string) => void;
  showMode: ShowMode;
};

@connect((store: any) => {
  return { ...store.user };
})
class CardContent extends React.Component<Props, State> {
  constructor(props: any) {
    super(props);
    const { applications } = this.props;
    let showLabelMode = new Map<string, boolean>();
    applications?.map((app) => {
      if (app.labels && Object.keys(app.labels).length > 1) {
        showLabelMode.set(app.name, true);
      } else {
        showLabelMode.set(app.name, false);
      }
    });
    this.state = {
      extendDotVisible: false,
      choseIndex: 0,
      showLabelMode: showLabelMode,
    };
  }

  onDeleteAppPlan = (name: string) => {
    this.props.deleteAppPlan(name);
  };

  onEditAppPlan = (item: ApplicationBase) => {
    this.props.editAppPlan(item);
  };

  onClickLabelFilter = (label: string) => {
    if (this.props.clickLabelFilter) {
      this.props.clickLabelFilter(label);
    }
  };

  onMoreLabels = (appName: string) => {
    let { showLabelMode } = this.state;
    let cur = showLabelMode.get(appName);
    showLabelMode.set(appName, cur ? false : true);
    this.setState({
      showLabelMode,
    });
  };

  isEditPermission = (item: ApplicationBase, button?: boolean) => {
    const { userInfo } = this.props;
    const project = item?.project?.name || this.props.projectName || '?';
    const request = { resource: `project:${project}/application:${item.name}`, action: 'update' };
    if (checkPermission(request, project, userInfo)) {
      if (button) {
        return (
          <RowAction
            icon={<AiOutlineEdit />}
            label="Edit"
            onClick={() => {
              this.onEditAppPlan(item);
            }}
          />
        );
      }
      return (
        <Menu.Item
          onClick={() => {
            this.onEditAppPlan(item);
          }}
        >
          <div className="dropdown-menu-item inline-center">
            <AiFillSetting />
            <Translation>Edit</Translation>
          </div>
        </Menu.Item>
      );
    } else {
      return null;
    }
  };

  isDeletePermission = (item: ApplicationBase, button?: boolean) => {
    const { userInfo } = this.props;
    const project = item?.project?.name || this.props.projectName || '?';
    const request = { resource: `project:${project}/application:${item.name}`, action: 'delete' };
    const onClick = () => {
      Dialog.confirm({
        type: 'confirm',
        content: <Translation>Unrecoverable after deletion, are you sure to delete it?</Translation>,
        onOk: () => {
          this.onDeleteAppPlan(item.name);
        },
        locale: locale().Dialog,
      });
    };
    if (checkPermission(request, project, userInfo)) {
      if (button) {
        return <RowAction icon={<AiOutlineDelete />} label="Remove" danger onClick={onClick} />;
      }
      return (
        <Menu.Item onClick={onClick}>
          <div className="dropdown-menu-item inline-center">
            <AiFillDelete /> <Translation>Remove</Translation>
          </div>
        </Menu.Item>
      );
    } else {
      return null;
    }
  };

  getColumns = () => {
    return [
      {
        key: 'name',
        title: <Translation>Name</Translation>,
        dataIndex: 'name',
        cell: (v: string, i: number, app: ApplicationBase) => (
          <span className="app-table-name">
            <Link className="app-table-nowrap" to={`/applications/${v}/config`}>
              {v}
            </Link>
            {app.alias && app.alias !== v && (
              <span className="app-table-alias">
                <Translation>alias</Translation>: {app.alias}
              </span>
            )}
          </span>
        ),
      },
      {
        key: 'health',
        title: <Translation>Health</Translation>,
        dataIndex: 'status',
        cell: (v: ApplicationStatusSummary) => <HealthBadge status={v} />,
      },
      {
        key: 'workflow',
        title: <Translation>Workflow</Translation>,
        dataIndex: 'status',
        cell: (v: ApplicationStatusSummary) => (
          <span className="app-table-nowrap">{workflowLabel(v?.workflow) || '-'}</span>
        ),
      },
      {
        key: 'components',
        title: <Translation>Components</Translation>,
        dataIndex: 'status',
        cell: (v: ApplicationStatusSummary) => <ComponentHealth status={v} compact />,
      },
      {
        key: 'envs',
        title: <Translation>Environments</Translation>,
        dataIndex: 'status',
        cell: (v: ApplicationStatusSummary) => <EnvHealth status={v} />,
      },
      {
        key: 'project',
        title: <Translation>Project</Translation>,
        dataIndex: 'project',
        cell: (v: Project) => {
          if (v && v.name) {
            return (
              <Link className="app-table-nowrap" to={`/projects/${v.name}/summary`}>
                {v.alias || v.name}
              </Link>
            );
          } else {
            return null;
          }
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
        key: 'labels',
        title: <Translation>Labels</Translation>,
        dataIndex: 'labels',
        cell: (label: Record<string, string>, i: number, v: ApplicationBase) => {
          const { showLabelMode } = this.state;
          const more = showLabelMode.get(v.name);
          let displayLabels = 0;
          return (
            <div>
              <div className={more ? '' : 'table-content-label'}>
                {label &&
                  Object.keys(label)?.map((key) => {
                    if (label && key.indexOf('ux.oam.dev') < 0 && key.indexOf('app.oam.dev') < 0) {
                      displayLabels++;
                      return (
                        <div>
                          <Tag
                            onClick={(e) => this.onClickLabelFilter(key + '=' + `${label[key]}`)}
                            key={`${key}=${label[key]}`}
                            style={{ margin: '2px' }}
                            color="blue"
                            size="small"
                          >{`${key}=${label[key]}`}</Tag>
                        </div>
                      );
                    }
                    return;
                  })}
              </div>
              {displayLabels > 1 && (
                <div>
                  <Tag
                    onClick={(e) => this.onMoreLabels(v.name)}
                    key={'showLabelTag'}
                    style={{ margin: '2px' }}
                    size="small"
                  >
                    <Translation>{more ? 'Hide' : 'More'}</Translation>
                    {more ? <Icon type="minus" /> : <Icon type="add" />}
                  </Tag>
                </div>
              )}
            </div>
          );
        },
      },
      {
        key: 'operation',
        title: <Translation>Actions</Translation>,
        dataIndex: 'operation',
        width: '200px',
        cell: (v: string, i: number, record: ApplicationBase) => {
          return (
            <div>
              {this.isEditPermission(record, true)}
              {this.isDeletePermission(record, true)}
            </div>
          );
        },
      },
    ];
  };

  render() {
    const { applications, setVisible, showMode } = this.props;
    const projectName = this.props.projectName || '?';
    if (!applications || applications.length === 0) {
      return (
        <Empty
          message={
            <section style={{ textAlign: 'center' }}>
              <Translation>There are no applications</Translation>
              <main>
                <Permission
                  request={{ resource: `project:${projectName}/application:*`, action: 'create' }}
                  project={projectName}
                >
                  <Button
                    component="a"
                    onClick={() => {
                      setVisible(true);
                    }}
                  >
                    <Translation>New Application</Translation>
                  </Button>
                </Permission>
              </main>
            </section>
          }
          style={{ minHeight: '400px' }}
        />
      );
    }
    const columns = this.getColumns();
    if (showMode == 'table') {
      return (
        <div className="app-table">
          <Table
            locale={locale().Table}
            className="customTable"
            size="medium"
            style={{ minWidth: '1200px' }}
            dataSource={applications}
            loading={false}
          >
            {columns.map((col) => (
              <Column {...col} key={col.key} align={'left'} />
            ))}
          </Table>
        </div>
      );
    }

    return (
      <div className="app-grid">
        {applications?.map((item: ApplicationBase) => {
          const { name, alias, icon, description, updateTime, readOnly, labels, project, status } = item;
          const showLabels = Object.keys(labels || {}).filter(
            (key) => key.indexOf('ux.oam.dev') < 0 && key.indexOf('app.oam.dev') < 0
          );
          return (
            <div className={`app-card tone-${healthOf(status)}`} key={name}>
              <div className="app-card-head">
                <Link to={`/applications/${name}/config`} className="app-card-icon">
                  {icon && icon !== 'none' ? <img src={icon} /> : <AiOutlineAppstore />}
                </Link>
                <div className="app-card-title">
                  <Link to={`/applications/${name}/config`} title={name}>
                    {alias || name}
                  </Link>
                  <span className="app-card-sub">
                    {alias && alias !== name ? <span>{name}</span> : null}
                    {project?.name && <span>{project.alias || project.name}</span>}
                  </span>
                </div>
                <Dropdown trigger={<AiOutlineMore className="app-card-more" />} align="tr br">
                  <Menu>
                    {this.isEditPermission(item)}
                    {this.isDeletePermission(item)}
                  </Menu>
                </Dropdown>
              </div>

              <div className="app-card-status">
                <HealthBadge status={status} />
                <WorkflowBadge status={status} />
              </div>

              <ComponentHealth status={status} />

              <div className="app-card-description" title={description}>
                {description}
              </div>

              <EnvHealth status={status} />

              {showLabels.length > 0 && (
                <div className="app-card-labels">
                  {showLabels.map((key) => (
                    <span
                      key={key}
                      className="app-card-label"
                      onClick={() => this.onClickLabelFilter(key + '=' + `${labels?.[key]}`)}
                    >{`${key}=${labels?.[key]}`}</span>
                  ))}
                </div>
              )}

              <div className="app-card-foot">
                <span title={momentDate(updateTime)}>
                  <Translation>Updated</Translation> {updateTime && moment(updateTime).fromNow()}
                </span>
                <If condition={readOnly}>
                  <span className="app-card-readonly">
                    <Translation>ReadOnly</Translation>
                  </span>
                </If>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
}

export default CardContent;
