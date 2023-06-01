import { Card, Grid, Dialog } from '@alifd/next';
import React, { Component } from 'react';

import helm from '../../../../assets/helm.svg';
import kubernetes from '../../../../assets/kubernetes.svg';
import terraform from '../../../../assets/terraform.svg';
import Empty from '../../../../components/Empty';
import { If } from '../../../../components/If';
import Permission from '../../../../components/Permission';
import { Translation } from '../../../../components/Translation';
import i18n from '../../../../i18n';
import type { ApplicationBase, ApplicationComponentBase, Trait } from '@velaux/data';
import './index.less';
import { showAlias } from '../../../../utils/common';
import { locale } from '../../../../utils/locale';
import { IoMdAdd } from 'react-icons/io';
import { AiOutlineDelete } from 'react-icons/ai';

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
      content: i18n.t('Are you sure want to delete this Component?').toString(),
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
            <Row key={item.name} wrap={true} className="box-item">
              <Col span={24}>
                <Card locale={locale().Card} contentHeight="auto">
                  <div className="components-list-nav">
                    <div
                      className="components-list-title"
                      onClick={() => {
                        editComponent(item);
                      }}
                    >
                      {this.getComponentTypeIcon(item)}
                      {showAlias(item)}
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
                            <AiOutlineDelete
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
                      const label = showAlias(trait.type, trait.alias);
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
                              <AiOutlineDelete
                                onClick={(event: React.MouseEvent<SVGElement>) => {
                                  event.stopPropagation();
                                  this.props.onDeleteTrait(item.name, trait.type);
                                }}
                                size={14}
                                className="danger-icon"
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
                        <IoMdAdd />
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
