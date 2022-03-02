import React, { Component, Fragment } from 'react';
import { Card, Grid, Icon, Dialog } from '@b-design/ui';
import type { Trait } from '../../../../interface/application';
import { momentDate } from '../../../../utils/common';
import './index.less';
import { If } from 'tsx-control-statements/components';
import locale from '../../../../utils/locale';
import i18n from 'i18next';

type Props = {
  traits: Trait[];
  isEditComponent: boolean;
  changeTraitStats: (visible: boolean, item: Trait) => void;
  onDeleteTrait: (traitType: string) => void;
  onAdd: () => void;
};

type TraitTrans = {
  alias?: string;
  description?: string;
  name?: string;
  properties?: any;
  type: string;
  createTime?: string;
  updateTime?: string;
  opetationAdd?: boolean;
};

class TraitsList extends Component<Props> {
  handleDelete = (traitType: string) => {
    Dialog.alert({
      content: i18n.t('Are you sure want to delete this trait?'),
      onOk: () => {
        this.props.onDeleteTrait(traitType || '');
      },
      onClose: () => {},
      locale: locale.Dialog,
    });
  };

  renderCardList = (item: TraitTrans) => {
    const { Col } = Grid;
    const { changeTraitStats } = this.props;
    return (
      <Col xl={12} m={12} s={24} className="padding16 card-trait-wraper">
        <Card locale={locale.Card}>
          <div className="traits-list-nav">
            <div
              className="traits-list-title"
              onClick={() => {
                changeTraitStats(true, item);
              }}
            >
              {item.alias ? `${item.alias}(${item.type})` : item.type}
            </div>
            <div className="traits-list-operation">
              <Icon
                type="ashbin1"
                size={14}
                className="margin-right-16 cursor-pointer"
                onClick={() => {
                  this.handleDelete(item.type || '');
                }}
              />
            </div>
          </div>
          <div className="traits-list-content">{item.description}</div>
          <div className="traits-list-date">{momentDate(item.createTime)}</div>
        </Card>
      </Col>
    );
  };

  renderAddCard = () => {
    const { Col } = Grid;
    return (
      <Col xl={12} m={12} s={24} className="padding16 card-add-wraper">
        <Card locale={locale.Card}>
          <div className="traits-add-operation">
            <Icon
              type="plus-circle"
              size={14}
              className="margin-right-16 cursor-pointer"
              onClick={() => {
                this.props.onAdd();
              }}
            />
          </div>
        </Card>
      </Col>
    );
  };

  initTraitList = () => {
    const { traits = [] } = this.props;
    return [...traits, { opetationAdd: true, type: '' }];
  };

  render() {
    const { Row } = Grid;
    const traits = this.initTraitList();
    return (
      <div className="traits-list-warper margin-bottom-20">
        <Row wrap={true} className="row-list">
          {(traits || []).map((item: TraitTrans) => (
            <Fragment>
              <If condition={!item.opetationAdd}>{this.renderCardList(item)}</If>
              <If condition={item.opetationAdd}>{this.renderAddCard()}</If>
            </Fragment>
          ))}
        </Row>
      </div>
    );
  }
}

export default TraitsList;
