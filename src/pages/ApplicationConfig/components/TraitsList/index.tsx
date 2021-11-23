import React, { Component } from 'react';
import { Card, Grid, Icon, Dialog } from '@b-design/ui';
import type { Trait } from '../../../../interface/application';
import { momentDate } from '../../../../utils/common';
import './index.less';
import { If } from 'tsx-control-statements/components';
import Empty from '../../../../components/Empty';
import Translation from '../../../../components/Translation';

type Props = {
  traits: Trait[];
  changeTraitStats: (visible: boolean, item: Trait) => void;
  onDeleteTrait: (traitType: string) => void;
  onAdd: () => void;
};
class TraitsList extends Component<Props> {
  handleDelete = (traitType: string) => {
    Dialog.alert({
      content: 'Marke Sure Delete Trait',
      onOk: () => {
        this.props.onDeleteTrait(traitType || '');
      },
      onClose: () => {},
    });
  };

  render() {
    const { Row, Col } = Grid;
    const { traits, changeTraitStats, onAdd } = this.props;
    return (
      <div className="traits-list-warper">
        <Row wrap={true}>
          {(traits || []).map((item: Trait) => (
            <Col span={8} key={item.type} className="padding16">
              <Card>
                <div className="traits-list-nav">
                  <div className="traits-list-title">
                    {item.alias}({item.type})
                  </div>
                  <div className="traits-list-operation">
                    <Icon
                      type="ashbin1"
                      size="medium"
                      className="margin-right-16 cursor-pointer"
                      onClick={() => {
                        this.handleDelete(item.type || '');
                      }}
                    />
                    <Icon
                      type="set"
                      size="medium"
                      className="cursor-pointer"
                      onClick={() => {
                        changeTraitStats(true, item);
                      }}
                    />
                  </div>
                </div>
                <div className="traits-list-content">{item.description}</div>
                <div className="traits-list-date">{momentDate(item.createTime)}</div>
              </Card>
            </Col>
          ))}
          <If condition={!traits || traits.length == 0}>
            <Empty
              message={
                <span>
                  <Translation>No Trait ,</Translation>
                  <a onClick={onAdd}>
                    <Translation>Go add</Translation>
                  </a>
                </span>
              }
            />
          </If>
        </Row>
      </div>
    );
  }
}

export default TraitsList;
