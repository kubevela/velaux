import type { MouseEvent } from 'react';
import React from 'react';
import './index.less';

import { Grid, Card, Tag, Balloon } from '@alifd/next';

import Empty from '../../../../components/Empty';
import { If } from '../../../../components/If';
import { Translation } from '../../../../components/Translation';
import type { Addon, AddonBaseStatus } from '@velaux/data';
import { intersectionArray } from '../../../../utils/common';
import { locale } from '../../../../utils/locale';

type State = {
  extendDotVisible: boolean;
  choseIndex: number;
};

type Props = {
  clickAddon: (name: string) => void;
  addonLists: Addon[];
  enabledAddons?: AddonBaseStatus[];
  selectTags: string[];
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
    const { addonLists, clickAddon, enabledAddons, selectTags } = this.props;

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
    const nameUpper = (name: string) => {
      return name
        .split('-')
        .map((sep) => {
          if (sep.length > 0) {
            return sep.toUpperCase()[0];
          }
          return sep;
        })
        .toString()
        .replace(',', '');
    };
    const orderAddonList: Addon[] = [];
    addonLists.map((addon) => {
      const status = enabledAddons?.filter((addonStatus: AddonBaseStatus) => {
        return addonStatus.name == addon.name;
      });
      if (selectTags.length > 0 && !intersectionArray(addon.tags, selectTags)?.length) {
        return;
      }
      if (status && status.length > 0 && status[0].phase == 'enabled') {
        orderAddonList.unshift(addon);
      } else {
        orderAddonList.push(addon);
      }
    });
    const notice = "This addon is experimental, please don't use it in production";
    return (
      <div>
        <If condition={addonLists}>
          <Row wrap={true}>
            {orderAddonList.map((item: Addon) => {
              const { name, icon, version, description, tags, registryName } = item;
              const status = enabledAddons?.filter((addonStatus: AddonBaseStatus) => {
                return addonStatus.name == name;
              });
              return (
                <Col xl={4} l={6} m={8} s={12} xxs={24} className={`card-content-wraper`} key={name}>
                  <Card locale={locale().Card} contentHeight="auto">
                    <a onClick={() => clickAddon(name)}>
                      <div className="cluster-card-top flexcenter">
                        <If condition={icon && icon != 'none'}>
                          <img src={icon} />
                        </If>
                        <If condition={!icon || icon === 'none'}>
                          <div
                            style={{
                              display: 'inline-block',
                              verticalAlign: 'middle',
                              padding: `2px 4px`,
                              width: '60px',
                              height: '60px',
                              borderRadius: '50%',
                              backgroundColor: '#fff',
                              textAlign: 'center',
                              lineHeight: '60px',
                            }}
                          >
                            <span style={{ color: '#1b58f4', fontSize: `2em` }}>{nameUpper(name)}</span>
                          </div>
                        </If>
                      </div>
                    </a>
                    <div className="content-wraper background-F9F8FF">
                      <Row className="content-title">
                        <Col span="16" className="font-size-16">
                          <a onClick={() => clickAddon(name)}>{name}</a>
                        </Col>
                        <If condition={registryName && registryName == 'experimental'}>
                          <Col span="8" className="flexright">
                            <Balloon trigger={<Tag color="yellow">Experimental</Tag>}>{notice}</Balloon>
                          </Col>
                        </If>
                      </Row>
                      <Row className="content-main">
                        <h4 className="color595959 font-size-14" title={description}>
                          {description}
                        </h4>
                      </Row>
                      <Row className="content-main-btn">
                        {tags?.map((tag: string) => {
                          return (
                            <Tag title={tag} style={{ marginRight: '8px' }} color={getTagColor(tag)} key={tag}>
                              {tag}
                            </Tag>
                          );
                        })}
                      </Row>

                      <Row className="content-foot colorA6A6A6">
                        <Col span="16">
                          <span>{version || '0.0.0'}</span>
                        </Col>
                        <Col span="8" className="text-align-right padding-right-10">
                          <If condition={status && status.length > 0 && status[0].phase == 'enabled'}>
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
