import React, { Component } from 'react';
import { Card, Grid, Icon, Dialog } from '@b-design/ui';
import { Trait } from '../../../../interface/application';
import { momentDate } from '../../../../utils/common';
import './index.less';

type Props = {
  traits: Array<Trait>;
  changeTraitStats: (visible: boolean, item: Trait) => void;
  onDeleteTrait: (traitType: string) => void;
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
    const { traits, changeTraitStats } = this.props;
    return (
      <div className="traits-list-warper">
        <Row wrap={true}>
          {(traits || []).map((item: Trait) => (
            <Col span={8} className="padding16">
              <Card>
                <div className="traits-list-nav">
                  <div className="traits-list-title">{item.type}</div>
                  <div className="traits-list-operation">
                    <Icon
                      type="wind-minus"
                      size="small"
                      className="margin-right-5 cursor-pointer"
                      onClick={() => {
                        this.handleDelete(item.type || '');
                      }}
                    />
                    <Icon
                      type="set"
                      size="small"
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
        </Row>
      </div>
    );
  }
}

export default TraitsList;
