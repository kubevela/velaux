import React, { MouseEvent } from 'react';
import './index.less';
import { Link } from 'dva/router';
import { Grid, Card, Menu, Dropdown, Dialog } from '@b-design/ui';
import { AppPlanBase } from '../../../../interface/applicationplan';
import Translation from '../../../../components/Translation';
import { momentDate } from '../../../../utils/common';
import Empty from '../../../../components/Empty';
import { If } from 'tsx-control-statements/components';

import appSvg from '../../../../assets/application.svg';

type State = {
  extendDotVisible: boolean;
  choseIndex: number;
};

type Props = {
  appPlans: AppPlanBase[];
  editAppPlan: (name: string) => void;
  deleteAppPlan: (name: string) => void;
};

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

  onEditAppPlan = (name: string) => {
    this.props.editAppPlan(name);
  };
  render() {
    const { Row, Col } = Grid;
    const { appPlans } = this.props;
    if (appPlans.length === 0) {
      return <Empty style={{ minHeight: '400px' }}></Empty>;
    }

    return (
      <Row wrap={true}>
        {appPlans.map((item: AppPlanBase, index: number) => {
          const { name, alias, status, icon, description, createTime } = item;
          const showName = alias || name;
          return (
            <Col span="6" className={`card-content-wraper`} key={index}>
              <Card contentHeight="auto">
                <Link to={`/applicationplans/${name}`}>
                  <div className="appplan-card-top flexcenter">
                    <If condition={icon && icon != 'none'}>
                      <img src={icon} />
                    </If>
                    <If condition={!icon || icon === 'none'}>
                      <img src={appSvg}></img>
                    </If>
                  </div>
                </Link>
                <div className="content-wraper background-F9F8FF">
                  <Row className="content-title">
                    <Col span="20" className="font-size-16 color1A1A1A">
                      <Link to={`/applicationplans/${name}`}>{showName}</Link>
                    </Col>
                    <Col span={4} className="dot-wraper">
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
                            ></path>
                            <path
                              d="M365.066 512c0 0 0 0 0 0 0 58.569 47.479 106.048 106.048 106.048 58.569 0 106.048-47.479 106.048-106.048 0 0 0 0 0 0 0-58.569-47.479-106.048-106.048-106.048-58.569 0-106.048 47.479-106.048 106.048 0 0 0 0 0 0z"
                              fill="#a6a6a6"
                              p-id="3450"
                            ></path>
                            <path
                              d="M365.066 826.61c0 0 0 0 0 0 0 58.569 47.479 106.048 106.048 106.048 58.569 0 106.048-47.479 106.048-106.048 0 0 0 0 0 0 0-58.569-47.479-106.048-106.048-106.048-58.569 0-106.048 47.479-106.048 106.048 0 0 0 0 0 0z"
                              fill="#a6a6a6"
                              p-id="3451"
                            ></path>
                          </svg>
                        }
                      >
                        <Menu>
                          <Menu.Item
                            disabled
                            onClick={() => {
                              this.onEditAppPlan(name);
                            }}
                          >
                            <Translation>Edit</Translation>
                          </Menu.Item>
                          <Menu.Item
                            onClick={() => {
                              Dialog.confirm({
                                type: 'confirm',
                                content: (
                                  <Translation>
                                    Unrecoverable after deletion. Are you sure you want to delete
                                    it?
                                  </Translation>
                                ),
                                onOk: () => {
                                  this.onDeleteAppPlan(name);
                                },
                              });
                            }}
                          >
                            <Translation>Remove</Translation>
                          </Menu.Item>
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
                    <Col span="8" className="text-align-right padding-right-10">
                      <If condition={status == 'deployed'}>
                        <span className="circle circle-success"></span>
                        <Translation>Deployed</Translation>
                      </If>
                      <If condition={!status || status == 'undeploy'}>
                        <span className="circle"></span>
                        <Translation>UnDeploy</Translation>
                      </If>
                      <If condition={status == 'warning'}>
                        <span className="circle circle-warning"></span>
                        <Translation>Warning</Translation>
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
