import type { MouseEvent } from 'react';
import React from 'react';
import './index.less';

import { Grid, Card, Tag } from '@b-design/ui';
import type { Addon } from '../../../../interface/addon';
import { If } from 'tsx-control-statements/components';
import Empty from '../../../../components/Empty';

type State = {
  extendDotVisible: boolean;
  choseIndex: number;
};

type Props = {
  clickAddon: () => void;
  addonLists: [];
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
    return (
      <div>
        <If condition={addonLists}>
          <Row wrap={true}>
            {addonLists.map((item: Addon) => {
              const { name, icon, version, description, tags } = item;
              return (
                <Col span="6" className={`card-content-wraper`} key={name}>
                  <Card contentHeight="auto">
                    <a onClick={() => clickAddon(name)}>
                      <div className="cluster-card-top flexcenter">
                        <If condition={icon && icon != 'none'}>
                          <img src={icon} />
                        </If>
                        <If condition={!icon || icon === 'none'}>
                          <img />
                        </If>
                      </div>
                    </a>
                    <div className="content-wraper background-F9F8FF">
                      <Row className="content-title">
                        <Col span="20" className="font-size-16">
                          <a onClick={() => clickAddon(name)}>{name}</a>
                        </Col>
                      </Row>
                      <Row className="content-main">
                        <h4 className="color595959 font-size-14" title={description}>
                          {description}
                        </h4>
                      </Row>
                      <If condition={tags}>
                        <Row className="content-main-btn">
                          {tags?.map((tag: string) => {
                            return <Tag key={tag}>{tag}</Tag>;
                          })}
                        </Row>
                      </If>

                      <Row className="content-foot colorA6A6A6">
                        <Col span="16">
                          <span>{version || '0.0.0'}</span>
                        </Col>
                      </Row>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </If>
        <If condition={!addonLists || addonLists.length == 0}>
          <Empty style={{ minHeight: '400px' }} />
        </If>
      </div>
    );
  }
}

export default CardContent;
