import React from 'react';
import './index.less';

import { Dropdown, Menu, Grid, Card, Dialog } from '@alifd/next';

import kubernetesSvg from '../../../../assets/kubernetes.svg';
import { If } from '../../../../components/If';
import { Translation } from '../../../../components/Translation';
import type { Cluster , LoginUserInfo } from '@velaux/data';
import { locale } from '../../../../utils/locale';
import { checkPermission } from '../../../../utils/permission';

import { connect } from 'dva';

type State = {
  extendDotVisible: boolean;
  choseIndex: number;
};

type Props = {
  clusters: [];
  userInfo?: LoginUserInfo;
  editCluster: (name: string) => void;
  deleteCluster: (name: string) => void;
};

@connect((store: any) => {
  return { ...store.user };
})
class CardContent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      extendDotVisible: false,
      choseIndex: 0,
    };
  }
  editCluster = (name: string) => {
    this.props.editCluster(name);
  };
  onDeleteCluster = (name: string) => {
    this.props.deleteCluster(name);
  };

  isEditPermission = (item: Cluster) => {
    const { userInfo } = this.props;
    const project = '';
    const request = { resource: `cluster:${item.name}`, action: 'update' };
    if (checkPermission(request, project, userInfo)) {
      return (
        <Menu.Item
          onClick={() => {
            this.editCluster(item.name);
          }}
        >
          <Translation>Edit</Translation>
        </Menu.Item>
      );
    } else {
      return null;
    }
  };

  isDeletePermission = (item: Cluster) => {
    const { userInfo } = this.props;
    const project = '';
    const request = { resource: `cluster:${item.name}`, action: 'delete' };
    if (checkPermission(request, project, userInfo)) {
      return (
        <Menu.Item
          onClick={() => {
            Dialog.confirm({
              type: 'confirm',
              content: <Translation>Are you sure you want the detach cluster?</Translation>,
              onOk: () => {
                this.onDeleteCluster(item.name);
              },
              locale: locale().Dialog,
            });
          }}
        >
          <Translation>Detach</Translation>
        </Menu.Item>
      );
    } else {
      return null;
    }
  };
  render() {
    const { Row, Col } = Grid;
    const { clusters } = this.props;
    return (
      <div>
        <Row wrap={true}>
          {clusters.map((item: Cluster) => {
            const { name, alias, status, icon, description, createTime, dashboardURL = '#' } = item;
            const showName = alias ? alias : name;
            const card = (
              <Card locale={locale} contentHeight="auto">
                <div className="cluster-card-top flexcenter">
                  <If condition={icon && icon != 'none'}>
                    <img src={icon} />
                  </If>
                  <If condition={!icon || icon === 'none'}>
                    <img src={kubernetesSvg} />
                  </If>
                </div>
                <div className="content-wrapper background-F9F8FF">
                  <Row className="content-title">
                    <Col span={16} className="font-size-16 color1A1A1A">
                      <If condition={dashboardURL}>
                        <a title={name} target="_blank" href={dashboardURL} rel="noopener noreferrer">
                          {showName}
                        </a>
                      </If>
                      <If condition={!dashboardURL}>{showName}</If>
                    </Col>
                    <If condition={name != 'local'}>
                      <Col span={8} className="dot-wrapper">
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
                    </If>
                    <If condition={name === 'local'}>
                      <Col span={8}>
                        <span
                          style={{
                            color: '#a6a6a6',
                            fontSize: '12px',
                            textAlign: 'right',
                            display: 'block',
                            width: '100%',
                            lineHeight: '24px',
                          }}
                        >
                          <Translation>Local</Translation>
                        </span>
                      </Col>
                    </If>
                  </Row>
                  <Row className="content-main">
                    <h4 className="color595959 font-size-14" title={description}>
                      {description}
                    </h4>
                  </Row>
                  <Row className="content-foot colorA6A6A6">
                    <Col span="16">
                      <span>{createTime}</span>
                    </Col>
                    <Col span="8" className="text-align-right padding-right-10">
                      <If condition={status == 'Healthy'}>
                        <span className="circle circle-success" />
                        <Translation>Healthy</Translation>
                      </If>
                      <If condition={status == 'Unhealthy'}>
                        <span className="circle circle-warning" />
                        <Translation>UnHealthy</Translation>
                      </If>
                    </Col>
                  </Row>
                </div>
              </Card>
            );
            return (
              <Col xl={6} m={8} s={12} xxs={24} className={`card-content-wrapper`} key={item.name}>
                {card}
              </Col>
            );
          })}
        </Row>
      </div>
    );
  }
}

export default CardContent;
