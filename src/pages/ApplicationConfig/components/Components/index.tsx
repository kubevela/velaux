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
import Permission from '../../../../components/Permission';
import terraform from '../../../../assets/terraform.svg';
import kubernetes from '../../../../assets/kubernetes.svg';
import helm from '../../../../assets/helm.svg';

type Props = {
  application?: ApplicationBase;
  components: ApplicationComponentBase[];
  editComponent: (item: ApplicationComponentBase) => void;
  onDeleteComponent: (name: string) => void;
  onAddComponent: () => void;
  onAddTrait: (componentName: string) => void;
  onDeleteTrait: (componentName: string, traitName: string) => void;
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
      locale: locale().Dialog,
    });
  };

  getComponentTypeIcon = (com: ApplicationComponentBase) => {
    if (com.workloadType?.type == 'configurations.terraform.core.oam.dev') {
      return <img className="component-icon" src={terraform} />;
    }
    if (com.componentType.indexOf('helm') > -1) {
      return <img className="component-icon" src={helm} />;
    }
    return <img className="component-icon" src={kubernetes} />;
  };

  render() {
    const { Row, Col } = Grid;
    const { components, editComponent, application } = this.props;
    const projectName = application && application.project?.name;
    return (
      <div className="list-warper">
        <div className="box">
          {(components || []).map((item: ApplicationComponentBase) => (
            <Row wrap={true} className="box-item">
              <Col span={24} key={item.name}>
                <Card locale={locale().Card} contentHeight="auto">
                  <div className="components-list-nav">
                    <div
                      className="components-list-title"
                      onClick={() => {
                        editComponent(item);
                      }}
                    >
                      {this.getComponentTypeIcon(item)}
                      {item.alias ? `${item.alias}(${item.name})` : item.name}
                    </div>
                    <If condition={item.main != true}>
                      <div className="components-list-operation">
                        <If condition={!application?.readOnly}>
                          <Permission
                            request={{
                              resource: `project:${projectName}/application:${application?.name}/component:${item.name}`,
                              action: 'delete',
                            }}
                            project={projectName}
                          >
                            <Icon
                              type="ashbin1"
                              size={14}
                              className="cursor-pointer danger-icon"
                              onClick={() => {
                                this.handleDelete(item.name || '');
                              }}
                            />
                          </Permission>
                        </If>
                      </div>
                    </If>
                  </div>
                  <If condition={item.description}>
                    <div className="components-list-content">{item.description}</div>
                  </If>
                  <Row wrap={true}>
                    {item.traits?.map((trait) => {
                      const label = trait.alias ? trait.alias + '(' + trait.type + ')' : trait.type;
                      return (
                        <div
                          key={trait.type}
                          onClick={() => this.props.changeTraitStats(true, trait, item.name)}
                          className="trait-icon"
                          title={trait.description || label}
                        >
                          <div>{label}</div>
                          <div className="trait-actions">
                            <Permission
                              request={{
                                resource: `project:${projectName}/application:${application?.name}/component:${item.name}/trait:${trait.type}`,
                                action: 'delete',
                              }}
                              project={projectName}
                            >
                              <Icon
                                onClick={(event: React.MouseEvent<HTMLElement>) => {
                                  event.stopPropagation();
                                  this.props.onDeleteTrait(item.name, trait.type);
                                }}
                                size={14}
                                className="danger-icon"
                                type="ashbin1"
                              />
                            </Permission>
                          </div>
                        </div>
                      );
                    })}
                    <Permission
                      request={{
                        resource: `project:${projectName}/application:${application?.name}/component:${item.name}/trait:*`,
                        action: 'create',
                      }}
                      project={projectName}
                    >
                      <div
                        title={i18n.t('Add a trait')}
                        className="trait-icon"
                        onClick={() => this.props.onAddTrait(item.name)}
                      >
                        <Icon type="add" size="small" />
                      </div>
                    </Permission>
                  </Row>
                </Card>
              </Col>
            </Row>
          ))}
          <If condition={!components || components.length == 0}>
            <Empty
              style={{ minHeight: '400px' }}
              message={
                <span>
                  <Translation>There are no components</Translation>
                </span>
              }
            />
          </If>
        </div>
      </div>
    );
  }
}

export default ComponentsList;
