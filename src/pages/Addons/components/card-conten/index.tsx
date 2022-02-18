import type { MouseEvent } from 'react';
import React from 'react';
import './index.less';

import { Grid, Card, Tag } from '@b-design/ui';
import type { Addon, AddonBaseStatus } from '../../../../interface/addon';
import { If } from 'tsx-control-statements/components';
import Empty from '../../../../components/Empty';
import locale from '../../../../utils/locale';
import Translation from '../../../../components/Translation';

type State = {
  extendDotVisible: boolean;
  choseIndex: number;
};

type Props = {
  clickAddon: (name: string) => void;
  addonLists: [];
  enabledAddons?: AddonBaseStatus[];
};

class CardContent extends React.Component<Props, State> {
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
    const { addonLists, clickAddon, enabledAddons } = this.props;

    const getTagColor = (tag: string) => {
      switch (tag) {
        case 'alpha':
          return 'red';
        case 'beta':
          return 'red';
        case 'GA':
          return 'green';
        default:
          return '';
      }
    };
    return (
      <div>
        <If condition={addonLists}>
          <Row wrap={true}>
            {addonLists.map((item: Addon) => {
              const { name, icon, version, description, tags, registryName } = item;
              const status = enabledAddons?.filter((addonStatus: AddonBaseStatus) => {
                return addonStatus.name == name;
              });
              return (
                <Col xl={6} m={8} s={12} xxs={24} className={`card-content-wraper`} key={name}>
                  <Card locale={locale.Card} contentHeight="auto">
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
                        <Col span="16" className="font-size-16">
                          <a onClick={() => clickAddon(name)}>{name}</a>
                        </Col>
                        <If condition={registryName}>
                          <Col span="8" className="flexright">
                            <Tag color="blue">{registryName}</Tag>
                          </Col>
                        </If>
                      </Row>
                      <Row className="content-main">
                        <h4 className="color595959 font-size-14" title={description}>
                          {description}
                        </h4>
                      </Row>
                      <If condition={tags}>
                        <Row className="content-main-btn">
                          {tags?.map((tag: string) => {
                            return (
                              <Tag
                                style={{ marginRight: '8px' }}
                                color={getTagColor(tag)}
                                key={tag}
                              >
                                {tag}
                              </Tag>
                            );
                          })}
                        </Row>
                      </If>

                      <Row className="content-foot colorA6A6A6">
                        <Col span="16">
                          <span>{version || '0.0.0'}</span>
                        </Col>
                        <Col span="8" className="text-align-right padding-right-10">
                          <If
                            condition={status && status.length > 0 && status[0].phase == 'enabled'}
                          >
                            <span className="circle circle-success" />
                            <Translation>Enabled</Translation>
                          </If>
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
