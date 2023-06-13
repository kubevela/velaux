import { connect } from 'dva';
import React from 'react';
import './index.less';
import { Link } from 'dva/router';
import { Grid, Card, Menu, Dropdown, Dialog, Button, Table, Tag, Icon } from '@alifd/next';
import { AiFillDelete, AiFillSetting } from 'react-icons/ai';

import type { ShowMode } from '../..';
import appSvg from '../../../../assets/application.svg';
import Empty from '../../../../components/Empty';
import { If } from '../../../../components/If';
import Permission from '../../../../components/Permission';
import { Translation } from '../../../../components/Translation';
import type { ApplicationBase , Project , LoginUserInfo } from '@velaux/data';
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
          <Button
            text
            size={'medium'}
            component={'a'}
            onClick={() => {
              this.onEditAppPlan(item);
            }}
          >
            <AiFillSetting />
            <Translation>Edit</Translation>
          </Button>
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
        return (
          <Button text size={'medium'} className="danger-btn" component={'a'} onClick={onClick}>
            <AiFillDelete /> <Translation>Remove</Translation>
          </Button>
        );
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
        title: <Translation>Name(Alias)</Translation>,
        dataIndex: 'name',
        cell: (v: string, i: number, app: ApplicationBase) => {
          const showName = app.name + '(' + (app.alias || '-') + ')';
          return <Link to={`/applications/${v}/config`}>{showName}</Link>;
        },
      },
      {
        key: 'project',
        title: <Translation>Project</Translation>,
        dataIndex: 'project',
        cell: (v: Project) => {
          if (v && v.name) {
            return <Link to={`/projects/${v.name}/summary`}>{v && v.name}</Link>;
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
                {label && Object.keys(label)?.map((key) => {
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
              <span className="line" />
              {this.isDeletePermission(record, true)}
            </div>
          );
        },
      },
    ];
  };

  render() {
    const { Row, Col } = Grid;
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
        <div style={{ overflow: 'auto' }}>
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
      <Row wrap={true}>
        {applications?.map((item: ApplicationBase) => {
          const { name, alias, icon, description, createTime, readOnly, labels } = item;
          const showName = alias || name;
          return (
            <Col xl={6} m={8} s={12} xxs={24} className={`card-content-wrapper`} key={`${item.name}`}>
              <Card locale={locale().Card} contentHeight="auto">
                <Link to={`/applications/${name}/config`}>
                  <div className="appplan-card-top flexcenter">
                    <If condition={icon && icon != 'none'}>
                      <img src={icon} />
                    </If>
                    <If condition={!icon || icon === 'none'}>
                      <img src={appSvg} />
                    </If>
                  </div>
                </Link>
                <div className="content-wrapper background-F9F8FF">
                  <Row className="content-title">
                    <Col span="20" className="font-size-16 color1A1A1A">
                      <Link to={`/applications/${name}/config`}>{showName}</Link>
                    </Col>
                    <Col span={4} className="dot-wrapper">
                      <Dropdown
                        trigger={
                          <svg
                            className={'action'}
                            viewBox="0 0 1024 1024"
                            version="1.1"
                            xmlns="http://www.w3.org/2000/svg"
                            p-id="3448"
                          >
                            <path
                              d="M365.066 197.39c0 0 0 0 0 0 0 58.569 47.479 106.048 106.048 106.048 58.569 0 106.048-47.479 106.048-106.048 0 0 0 0 0 0 0-58.569-47.479-106.048-106.048-106.048-58.569 0-106.048 47.479-106.048 106.048 0 0 0 0 0 0z"
                              fill="#a6a6a6"
                              p-id="3449"
                            />
                            <path
                              d="M365.066 512c0 0 0 0 0 0 0 58.569 47.479 106.048 106.048 106.048 58.569 0 106.048-47.479 106.048-106.048 0 0 0 0 0 0 0-58.569-47.479-106.048-106.048-106.048-58.569 0-106.048 47.479-106.048 106.048 0 0 0 0 0 0z"
                              fill="#a6a6a6"
                              p-id="3450"
                            />
                            <path
                              d="M365.066 826.61c0 0 0 0 0 0 0 58.569 47.479 106.048 106.048 106.048 58.569 0 106.048-47.479 106.048-106.048 0 0 0 0 0 0 0-58.569-47.479-106.048-106.048-106.048-58.569 0-106.048 47.479-106.048 106.048 0 0 0 0 0 0z"
                              fill="#a6a6a6"
                              p-id="3451"
                            />
                          </svg>
                        }
                      >
                        <Menu>
                          {this.isEditPermission(item)}
                          {this.isDeletePermission(item)}
                        </Menu>
                      </Dropdown>
                    </Col>
                  </Row>
                  <Row className="content-main">
                    <h4 className="color595959 font-size-14" title={description}>
                      {description}
                    </h4>
                  </Row>
                  <Row className="content-labels">
                    {labels &&
                      Object.keys(labels).map((key) => {
                        if (labels && key.indexOf('ux.oam.dev') < 0 && key.indexOf('app.oam.dev')) {
                          return (
                            <Tag
                              onClick={(e) => this.onClickLabelFilter(key + '=' + `${labels[key]}`)}
                              key={key}
                              style={{ margin: '4px' }}
                              color="blue"
                            >{`${key}=${labels[key]}`}</Tag>
                          );
                        }
                        return null;
                      })}
                  </Row>
                  <Row className="content-foot colorA6A6A6">
                    <Col span="16">
                      <span>{createTime && momentDate(createTime)}</span>
                    </Col>
                    <Col span={8} className="flexright">
                      <If condition={readOnly}>
                        <span className="circle circle-warning" />
                        <Translation>ReadOnly</Translation>
                      </If>
                    </Col>
                  </Row>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    );
  }
}

export default CardContent;
