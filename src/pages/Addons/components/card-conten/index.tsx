import React, { MouseEvent } from 'react';
import './index.less';
import { Link } from 'dva/router';

import { Grid, Card, Button, Tag } from '@b-design/ui';
import { Addon } from '../../../../interface/addon';
import Translation from '../../../../components/Translation';
import Img from '../../../../assets/card.png';
import { If } from 'tsx-control-statements/components';

type State = {
  extendDotVisible: boolean;
  choseIndex: number;
};

type Props = {
  clickAddon: () => void;
  addonLists: []
};

class CardContent extends React.Component<any, State> {
  constructor(props: Props) {
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
    const { addonLists, clickAddon } = this.props;
    const imgSrc = this.props.cardImg || Img;
    return (
      <Row wrap={true}>
        {addonLists.map((item: Addon, index: number) => {
          const { name, icon, version, description, tags } = item;
          return (
            <Col span="6" className={`card-content-wraper`} key={index}>
              <Card contentHeight="auto">
                <div>
                  <If condition={icon}>
                    <img src={icon}></img>
                  </If>
                </div>
                <div className="content-wraper background-F9F8FF">
                  <Row className="content-title">
                    <Col span="20" className="font-size-16">
                      <a onClick={() => clickAddon(name)}>{name}</a>
                    </Col>
                  </Row>
                  <Row className="content-main">
                    <h4 className="color595959 font-size-14">{description}</h4>
                  </Row>
                  <If condition={tags}>
                    <Row className="content-main-btn">
                      {tags.map((item: String) => {
                        return <Tag>{item}</Tag>
                      })}
                    </Row>
                  </If>

                  <Row className="content-foot colorA6A6A6">
                    <Col span="16">
                      <span>{version}</span>
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
