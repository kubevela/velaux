import React, { MouseEvent } from 'react';
import './index.less';
import { Link } from 'dva/router';

import { Button, Message, Grid, Dialog, Form, Input, Card, Icon } from '@b-design/ui';
import { AppContent } from '../../../../model/application';
import Translation from '../../../../components/Translation';
import Img from '../../../../assets/card.png';

type State = {
  extendDotVisible: boolean;
  choseIndex: number;
};

class CardContent extends React.Component<any, State> {
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

  render() {
    const { Row, Col } = Grid;
    const { extendDotVisible, choseIndex } = this.state;
    const { appContent, path, workFlowPath } = this.props;
    const imgSrc = this.props.cardImg || Img;
    return (
      <Row wrap={true}>
        {appContent.map((item: AppContent, index: number) => {
          const { name, status, icon, description, createTime, href, btnContent } = item;
          return (
            <Col span="6" className={`card-content-wraper`} key={index}>
              <Link to={`/${path}/${name}`}>
                <Card contentHeight="auto">
                  <img src={imgSrc} alt="app-card" />
                  <div className="content-wraper background-F9F8FF">
                    <Row className="content-title">
                      <Col span="20" className="font-size-16 color1A1A1A">
                        {' '}
                        {name}
                      </Col>
                      <Col
                        span="4"
                        className="dot-wraper"
                        onClick={(e) => {
                          this.handleClick(index, e);
                        }}
                      >
                        <div>
                          {extendDotVisible && choseIndex === index && (
                            <ul>
                              <li>
                                <Link to="">
                                  <Translation className="color545454">Visit</Translation>
                                </Link>
                              </li>
                              <li>
                                <Link to={`/${workFlowPath}/${name}`}>
                                  <Translation className="color545454">Workflow</Translation>
                                </Link>
                              </li>
                              <li>
                                {' '}
                                <Translation className="color545454">Add component</Translation>
                              </li>
                              <li>
                                {' '}
                                <Translation className="color545454">Publish model</Translation>
                              </li>
                            </ul>
                          )}
                        </div>
                      </Col>
                    </Row>
                    <Row className="content-main">
                      <h4 className="color595959 font-size-14">{description}</h4>
                    </Row>
                    <Row className="content-main-btn">
                      <Button type="secondary" className="height-24">
                        {btnContent}
                      </Button>
                    </Row>

                    <Row className="content-foot colorA6A6A6">
                      <Col span="16">
                        <span>{createTime}</span>
                      </Col>
                      <Col span="8" className="text-align-right padding-right-10">
                        {status}
                      </Col>
                    </Row>
                  </div>
                </Card>
              </Link>
            </Col>
          );
        })}
      </Row>
    );
  }
}

export default CardContent;
