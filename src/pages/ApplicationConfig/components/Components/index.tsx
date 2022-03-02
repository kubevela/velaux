import React, { Component } from 'react';
import { Card, Grid, Icon, Dialog } from '@b-design/ui';
import type { ApplicationComponent } from '../../../../interface/application';
import { momentDate } from '../../../../utils/common';
import './index.less';
import { If } from 'tsx-control-statements/components';
import Empty from '../../../../components/Empty';
import Translation from '../../../../components/Translation';
import locale from '../../../../utils/locale';
import i18n from 'i18next';

type Props = {
  components: ApplicationComponent[];
  editComponentstats: (item: ApplicationComponent) => void;
  onDeleteComponent: (name: string) => void;
  onAddComponent: () => void;
};

class ComponentsList extends Component<Props> {
  handleDelete = (name: string) => {
    Dialog.alert({
      content: i18n.t('Are you sure want to delete this Component?'),
      onOk: () => {
        this.props.onDeleteComponent(name || '');
      },
      onClose: () => {},
      locale: locale.Dialog,
    });
  };

  render() {
    const { Row, Col } = Grid;
    const { components, editComponentstats, onAddComponent } = this.props;
    return (
      <div className="components-list-warper">
        <Row wrap={true}>
          {(components || []).map((item: ApplicationComponent) => (
            <Col xl={8} m={12} s={24} key={item.type} className="padding16">
              <Card locale={locale.Card}>
                <div className="components-list-nav">
                  <div
                    className="components-list-title"
                    onClick={() => {
                      editComponentstats(item);
                    }}
                  >
                    {item.alias ? `${item.alias}(${item.name})` : item.name}
                  </div>
                  <If condition={item.main != true}>
                    <div className="components-list-operation">
                      <Icon
                        type="ashbin1"
                        size={14}
                        className="cursor-pointer"
                        onClick={() => {
                          this.handleDelete(item.name || '');
                        }}
                      />
                    </div>
                  </If>
                </div>
                <div className="components-list-content">{item.description}</div>
                <div className="components-list-date">{momentDate(item.createTime)}</div>
              </Card>
            </Col>
          ))}

          <If condition={!components || components.length == 0}>
            <Empty
              message={
                <span>
                  <Translation>There is no components, </Translation>
                  <a onClick={onAddComponent}>
                    <Translation>New</Translation>
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

export default ComponentsList;
