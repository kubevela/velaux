import React from 'react';
import './index.less';
import { Link } from 'react-router-dom';
import { Button, Message, Grid, Dialog, Form, Input, Card, Icon } from '@b-design/ui';
import { appContent } from '../../constants';
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
    const imgSrc = this.props.cardImg || Img;
    return (
      <Row wrap={true}>
        {appContent.map((item, index) => {
          const { title, hasExtend, description, btnContent, date, status } = item;
          return (
            <Col span="6" className={`card-content-wraper`} key={index}>
              <Card contentHeight="auto">
                <img src={imgSrc} alt="app-card" />
                <div className="content-wraper">
                  <Row className="content-title">
                    <Col span="20"> {title}</Col>
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
                              <Link to={`/application/${title}`}>
                                <Translation>Visit</Translation>
                              </Link>
                            </li>
                            <li>
                              <Link to={`/workflow/${title}`}>
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
                      <span>{date}</span>
                    </Col>
                    <Col span="8">{status}</Col>
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
