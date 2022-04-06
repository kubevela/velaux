import React, { Component } from 'react';
import { Card, Grid, Icon, Dialog } from '@b-design/ui';
import type {
  ApplicationBase,
  ApplicationComponentBase,
  Trait,
} from '../../../../interface/application';
import './index.less';
import { If } from 'tsx-control-statements/components';
import Empty from '../../../../components/Empty';
import Translation from '../../../../components/Translation';
import locale from '../../../../utils/locale';
import i18n from '../../../../i18n';
import TraitIcon from '../../../../components/TraitIcon';
import Permission from '../../../../components/Permission';

type Props = {
  application?: ApplicationBase;
  components: ApplicationComponentBase[];
  editComponent: (item: ApplicationComponentBase) => void;
  onDeleteComponent: (name: string) => void;
  onAddComponent: () => void;
  changeTraitStats: (isEditTrait: boolean, traitItem: Trait, componentName: string) => void;
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
    const { components, editComponent, onAddComponent, application } = this.props;
    return (
      <div className="components-list-warper">
        <Row wrap={true}>
          {(components || []).map((item: ApplicationComponentBase) => (
            <Col xl={8} m={12} s={24} key={item.name} className="padding16">
              <Card locale={locale.Card} contentHeight="auto">
                <div className="components-list-nav">
                  <Permission
                    request={{
                      resource: `project/application/component:${item.name}`,
                      action: 'update',
                    }}
                    project={''}
                  >
                    <div
                      className="components-list-title"
                      onClick={() => {
                        editComponent(item);
                      }}
                    >
                      {item.alias ? `${item.alias}(${item.name})` : item.name}
                    </div>
                  </Permission>
                  <If condition={item.main != true}>
                    <div className="components-list-operation">
                      <If condition={!application?.readOnly}>
                        <Permission
                          request={{
                            resource: `project/application/component:${item.name}`,
                            action: 'delete',
                          }}
                          project={''}
                        >
                          <Icon
                            type="ashbin1"
                            size={14}
                            className="cursor-pointer"
                            onClick={() => {
                              this.handleDelete(item.name || '');
                            }}
                          />
                        </Permission>
                      </If>
                    </div>
                  </If>
                </div>
                <div className="components-list-content">{item.description}</div>
                <Row wrap={true}>
                  {item.traits?.map((trait) => {
                    const label = trait.alias ? trait.alias + '(' + trait.type + ')' : trait.type;
                    return (
                      <Col xs={24} l={12} key={trait.type}>
                        <div
                          onClick={() => this.props.changeTraitStats(true, trait, item.name)}
                          className="trait-icon"
                          title={trait.description || label}
                        >
                          <TraitIcon name={trait.type} />
                          <div>{label}</div>
                        </div>
                      </Col>
                    );
                  })}
                </Row>
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
