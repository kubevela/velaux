import type { MouseEvent } from 'react';
import { connect } from 'dva';
import React from 'react';
import './index.less';
import { Link } from 'dva/router';
import { Grid, Card, Menu, Dropdown, Dialog, Button, Table } from '@b-design/ui';
import type { ApplicationBase } from '../../../../interface/application';
import Translation from '../../../../components/Translation';
import { momentDate } from '../../../../utils/common';
import Empty from '../../../../components/Empty';
import { If } from 'tsx-control-statements/components';

import appSvg from '../../../../assets/application.svg';
import locale from '../../../../utils/locale';
import type { LoginUserInfo } from '../../../../interface/user';
import { checkPermission } from '../../../../utils/permission';
import Permission from '../../../../components/Permission';
import type { ShowMode } from '../..';
import type { Project } from '../../../../interface/project';
const { Column } = Table;

type State = {
  extendDotVisible: boolean;
  choseIndex: number;
};

type Props = {
  applications?: ApplicationBase[];
  userInfo?: LoginUserInfo;
  projectName?: string;
  editAppPlan: (item: ApplicationBase) => void;
  deleteAppPlan: (name: string) => void;
  setVisible: (visible: boolean) => void;
  showMode: ShowMode;
};

@connect((store: any) => {
  return { ...store.user };
})
class CardContent extends React.Component<Props, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      extendDotVisible: false,
      choseIndex: 0,
    };
  }

  handleClick = (index: number, e: MouseEvent) => {
    e.preventDefault();
    const { extendDotVisible } = this.state;
    this.setState({
      extendDotVisible: !extendDotVisible,
      choseIndex: index,
    });
  };

  onDeleteAppPlan = (name: string) => {
    this.props.deleteAppPlan(name);
  };

  onEditAppPlan = (item: ApplicationBase) => {
    this.props.editAppPlan(item);
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
            ghost={true}
            component={'a'}
            onClick={() => {
              this.onEditAppPlan(item);
            }}
          >
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
          <Translation>Edit</Translation>
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
        content: (
          <Translation>Unrecoverable after deletion, are you sure to delete it?</Translation>
        ),
        onOk: () => {
          this.onDeleteAppPlan(item.name);
        },
        locale: locale().Dialog,
      });
    };
    if (checkPermission(request, project, userInfo)) {
      if (button) {
        return (
          <Button text size={'medium'} ghost={true} component={'a'} onClick={onClick}>
            <Translation>Remove</Translation>
          </Button>
        );
      }
      return (
        <Menu.Item onClick={onClick}>
          <Translation>Remove</Translation>
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
        key: 'operation',
        title: <Translation>Actions</Translation>,
        dataIndex: 'operation',
        width: '200px',
        cell: (v: string, i: number, record: ApplicationBase) => {
          return (
            <div>
              {this.isDeletePermission(record, true)}
              <span className="line" />
              {this.isEditPermission(record, true)}
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
                    ghost={true}
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
            hasBorder={false}
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
          const { name, alias, icon, description, createTime, readOnly } = item;
          const showName = alias || name;
          return (
            <Col
              xl={6}
              m={8}
              s={12}
              xxs={24}
              className={`card-content-wrapper`}
              key={`${item.name}`}
            >
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
