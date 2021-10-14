import React from 'react';
import './index.less';
import { Link } from 'react-router-dom';
import { Button, Message, Grid, Dialog, Form, Input, Card, Icon } from '@b-design/ui';
import { AppContent } from '../../model/application';
import Translation from '../Translation';
import Img from '../../assets/card.png';

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

  handleClick = (index: number) => {
    console.log('index', index);
    const { extendDotVisible } = this.state;
    this.setState({
      extendDotVisible: !extendDotVisible,
      choseIndex: index,
    });
  };

  render() {
    const { Row, Col } = Grid;
    const { extendDotVisible, choseIndex } = this.state;
    const { appContent } = this.props;
    const imgSrc = this.props.cardImg || Img;
    return (
      <Row wrap={true}>
        {appContent.map((item: AppContent, index: number) => {
          const { name, status, icon, description, createTime, href, btnContent } = item;
          return (
            <Col span="6" className={`card-content-wraper`} key={index}>
              <Link to={`/application/${name}`}>
                <Card contentHeight="auto">
                  <img src={imgSrc} alt="app-card" />
                  <div className="content-wraper">
                    <Row className="content-title">
                      <Col span="20"> {name}</Col>
                      <Col
                        span="4"
                        className="dot-wraper"
                        onClick={() => {
                          this.handleClick(index);
                        }}
                      >
                        <div>
                          {extendDotVisible && choseIndex === index && (
                            <ul>
                              <li>
                                <Link to={`/application/${name}`}>
                                  <Translation>Visit</Translation>
                                </Link>
                              </li>
                              <li>
                                <Link to={`/workflow/${name}`}>
                                  <Translation>Workflow</Translation>
                                </Link>
                              </li>
                              <li>
                                {' '}
                                <Translation>Add component</Translation>
                              </li>
                              <li>
                                {' '}
                                <Translation>Publish model</Translation>
                              </li>
                            </ul>
                          )}
                        </div>
                      </Col>
                    </Row>
                    <Row className="content-main">
                      <h4>{description}</h4>
                    </Row>
                    <Row className="content-main-btn">
                      <Button type="secondary">{btnContent}</Button>
                    </Row>

                    <Row className="content-foot">
                      <Col span="16">
                        <span>{createTime}</span>
                      </Col>
                      <Col span="8">{status}</Col>
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
