import React from 'react';
import './index.less';
import { Link } from 'react-router-dom';
import { Button, Message, Grid, Dialog, Form, Input, Card, Icon } from '@b-design/ui';
import { appContent } from '../../constants/application';
import Img from '../../assets/card.png';

type State = {
  extendDotVisible: boolean;
};

class CardContent extends React.Component<any, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      extendDotVisible: false
    }
  }

  handleClick = () => {
    const { extendDotVisible } = this.state;
    this.setState({
      extendDotVisible: !extendDotVisible
    })
  }

  render() {
    const { Row, Col } = Grid;
    const { extendDotVisible } = this.state;
    const imgSrc = this.props.cardImg || Img;
    return (
      <Row wrap={true}>
        {appContent.map((item, index) => {
          const { title, hasExtend, description, btnContent, date, status } = item;
          return (
            <Col span='6' className="card-content-wraper">
              <Card contentHeight="auto">
                <img src={imgSrc} alt="app-card" />
                <div className='content-wraper'>
                  <Row className="content-title">
                    <Col span='20'> {title}</Col>
                    <Col span='4' className='dot-wraper' onClick={this.handleClick}>
                      <div>
                        {
                          extendDotVisible && (
                            <ul>
                              <li>
                                <Link to={`/application/${title}`}> 访问</Link>
                              </li>
                              <li>工作流</li>
                              <li>添加组件</li>
                              <li>发布成模型</li>
                            </ul>
                          )
                        }

                      </div>
                    </Col>
                  </Row>
                  <Row className='content-main'>
                    <h4>{description}</h4>
                  </Row>
                  <Row className='content-main-btn'>
                    <Button type="secondary">{btnContent}</Button>
                  </Row>

                  <Row className="content-foot">
                    <Col span='16'>
                      <span>{date}</span>
                    </Col>
                    <Col span='8'>{status}</Col>
                  </Row>
                </div>
              </Card>
            </Col>
          )
        })}
      </Row>
    )
  }
}


export default CardContent;