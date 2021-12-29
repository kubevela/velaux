import type { MouseEvent } from 'react';
import React from 'react';
import './index.less';
import { Link } from 'dva/router';
import { Grid, Card, Menu, Dropdown, Dialog, Button } from '@b-design/ui';
import type { ApplicationBase } from '../../../../interface/application';
import Translation from '../../../../components/Translation';
import { momentDate } from '../../../../utils/common';
import Empty from '../../../../components/Empty';
import { If } from 'tsx-control-statements/components';

import appSvg from '../../../../assets/application.svg';
import locale from '../../../../utils/locale';

type State = {
  extendDotVisible: boolean;
  choseIndex: number;
};

type Props = {
  applications: ApplicationBase[];
  editAppPlan: (name: string) => void;
  deleteAppPlan: (name: string) => void;
  setVisible: (visible: boolean) => void;
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
    const { applications, setVisible } = this.props;
    if (applications.length === 0) {
      return (
        <Empty
          message={
            <section style={{ textAlign: 'center' }}>
              <Translation>There is no applications</Translation>
              <main>
                <Button
                  component="a"
                  ghost={true}
                  onClick={() => {
                    setVisible(true);
                  }}
                >
                  Please click create applications
                </Button>
              </main>
            </section>
          }
          style={{ minHeight: '400px' }}
        />
      );
    }

    return (
      <Row wrap={true}>
        {applications.map((item: ApplicationBase, index: number) => {
          const { name, alias, icon, description, createTime } = item;
          const showName = alias || name;
          return (
            <Col xl={6} m={8} s={12} xxs={24} className={`card-content-wraper`} key={index}>
              <Card locale={locale.Card} contentHeight="auto">
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
                <div className="content-wraper background-F9F8FF">
                  <Row className="content-title">
                    <Col span="20" className="font-size-16 color1A1A1A">
                      <Link to={`/applications/${name}/config`}>{showName}</Link>
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
                                    Unrecoverable after deletion, are you sure you want to delete
                                    it?
                                  </Translation>
                                ),
                                onOk: () => {
                                  this.onDeleteAppPlan(name);
                                },
                                locale: locale.Dialog,
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
