import { Dialog } from '@alifd/next';
import React, { useState } from 'react';
import { AiOutlineDelete, AiOutlineDown, AiOutlineEdit, AiOutlineLink, AiOutlineRight } from 'react-icons/ai';
import { IoMdAdd } from 'react-icons/io';

import type {
  ApplicationBase,
  ApplicationComponent,
  ApplicationComponentBase,
  ComponentDependency,
  Trait,
} from '@velaux/data';
import { getApplicationComponent } from '../../../../api/application';
import helm from '../../../../assets/helm.svg';
import kubernetes from '../../../../assets/kubernetes.svg';
import terraform from '../../../../assets/terraform.svg';
import Empty from '../../../../components/Empty';
import Permission from '../../../../components/Permission';
import { PropertyList } from '../../../../components/RowList';
import { RowAction } from '../../../../components/RowAction';
import { StatusBadge } from '../../../../components/StatusBadge';
import { Translation } from '../../../../components/Translation';
import i18n from '../../../../i18n';
import { healthLabels } from '../../../ApplicationList/components/AppStatus/health';
import { dependencyItems } from '../../../../utils/dependencies';
import { locale } from '../../../../utils/locale';
import type { ComponentStatusIn } from './model';
import { componentDependsOn, componentHealth } from './model';
import './index.less';

type Props = {
  application?: ApplicationBase;
  components: ApplicationComponentBase[];
  // statuses are the application's status in each env, for health and
  // dependencies.
  statuses: Array<ComponentStatusIn & { status?: { dependencies?: ComponentDependency[] } }>;
  editComponent: (item: ApplicationComponentBase) => void;
  onDeleteComponent: (name: string) => void;
  onAddTrait: (componentName: string) => void;
  onDeleteTrait: (componentName: string, traitName: string) => void;
  changeTraitStats: (isEditTrait: boolean, traitItem: Trait, componentName: string) => void;
};

function typeIcon(com: ApplicationComponentBase) {
  if (com.workloadType?.type == 'configurations.terraform.core.oam.dev') {
    return terraform;
  }
  if (com.componentType.indexOf('helm') > -1) {
    return helm;
  }
  return kubernetes;
}

// ComponentList lists an application's components as rows to compare: each
// one's type, health in each env, traits and what it depends on. A row expands
// to its properties and its health messages.
const ComponentList = (props: Props) => {
  const { application, components, statuses } = props;
  const [open, setOpen] = useState<Record<string, ApplicationComponent | 'loading' | undefined>>({});
  const projectName = application?.project?.name || '';
  const appName = application?.name || '';
  const allDependencies = statuses.flatMap((s) => s.status?.dependencies || []);

  const toggle = (name: string) => {
    if (open[name]) {
      setOpen({ ...open, [name]: undefined });
      return;
    }
    setOpen({ ...open, [name]: 'loading' });
    getApplicationComponent(appName, name).then((detail: ApplicationComponent) =>
      setOpen((current) => (current[name] ? { ...current, [name]: detail } : current))
    );
  };

  const remove = (name: string) =>
    Dialog.confirm({
      content: i18n.t('Are you sure want to delete this Component?').toString(),
      onOk: () => props.onDeleteComponent(name),
      locale: locale().Dialog,
    });

  if (!components || components.length === 0) {
    return <Empty message={<Translation>There are no components</Translation>} />;
  }

  return (
    <div className="row-list component-list">
      <div className="row-list-head">
        <span />
        <span>
          <Translation>Name</Translation>
        </span>
        <span>
          <Translation>Health</Translation>
        </span>
        <span>
          <Translation>Traits</Translation>
        </span>
        <span>
          <Translation>Depends on</Translation>
        </span>
        <span />
      </div>
      {components.map((com) => {
        const health = componentHealth(com.name, statuses);
        const dependsOn = componentDependsOn(com.dependsOn, dependencyItems(com.name, allDependencies));
        const detail = open[com.name];
        const expanded = !!detail;
        return (
          <div key={com.name} className={`row-list-row ${expanded ? 'expanded' : ''}`}>
            <div className="row-list-main">
              <span className="row-list-chevron" onClick={() => toggle(com.name)}>
                {expanded ? <AiOutlineDown /> : <AiOutlineRight />}
              </span>
              <span className="row-list-name" onClick={() => toggle(com.name)}>
                <img src={typeIcon(com)} />
                <span>
                  <span className="row-list-title">{com.alias || com.name}</span>
                  <span className="row-list-type">{com.componentType}</span>
                </span>
              </span>
              <span className="component-row-health">
                {health.length === 0 ? (
                  <span className="row-list-muted">
                    <Translation>Not deployed</Translation>
                  </span>
                ) : (
                  health.map((h) => (
                    <span
                      key={h.env}
                      className={`component-env tone-${h.health}`}
                      title={h.message || healthLabels[h.health]}
                    >
                      <span className="status-dot" />
                      {h.env}
                    </span>
                  ))
                )}
              </span>
              <span className="component-row-traits">
                {(com.traits || []).map((trait) => (
                  <span
                    key={trait.type}
                    className={`component-trait${application?.readOnly ? ' readonly' : ''}`}
                    title={
                      [trait.alias !== trait.type ? trait.alias : undefined, trait.description]
                        .filter(Boolean)
                        .join('\n') || undefined
                    }
                    onClick={application?.readOnly ? undefined : () => props.changeTraitStats(true, trait, com.name)}
                  >
                    {trait.type}
                    {!application?.readOnly && (
                      <Permission
                        request={{
                          resource: `project:${projectName}/application:${appName}/component:${com.name}/trait:${trait.type}`,
                          action: 'delete',
                        }}
                        project={projectName}
                      >
                        <AiOutlineDelete
                          className="component-trait-delete"
                          onClick={(e: React.MouseEvent<SVGElement>) => {
                            e.stopPropagation();
                            props.onDeleteTrait(com.name, trait.type);
                          }}
                        />
                      </Permission>
                    )}
                  </span>
                ))}
                {!application?.readOnly && (
                  <Permission
                    request={{
                      resource: `project:${projectName}/application:${appName}/component:${com.name}/trait:*`,
                      action: 'create',
                    }}
                    project={projectName}
                  >
                    <span
                      className="component-trait add"
                      title={i18n.t('Add a trait').toString()}
                      onClick={() => props.onAddTrait(com.name)}
                    >
                      <IoMdAdd />
                    </span>
                  </Permission>
                )}
              </span>
              <span className="component-row-deps">
                {dependsOn.length === 0 ? (
                  <span className="row-list-muted">-</span>
                ) : (
                  dependsOn.map((d) =>
                    d.inferred ? (
                      <span key={d.name + d.where} className="component-dep inferred" title={d.inferred}>
                        <AiOutlineLink />
                        {d.name}
                        {d.where && <span className="component-dep-where">{d.where}</span>}
                      </span>
                    ) : (
                      <span key={d.name} className="component-dep">
                        {d.name}
                      </span>
                    )
                  )
                )}
              </span>
              <span className="row-list-actions">
                {!application?.readOnly && (
                  <RowAction icon={<AiOutlineEdit />} label="Edit" onClick={() => props.editComponent(com)} />
                )}
                {!com.main && !application?.readOnly && (
                  <Permission
                    request={{
                      resource: `project:${projectName}/application:${appName}/component:${com.name}`,
                      action: 'delete',
                    }}
                    project={projectName}
                  >
                    <RowAction icon={<AiOutlineDelete />} label="Delete" danger onClick={() => remove(com.name)} />
                  </Permission>
                )}
              </span>
            </div>
            {expanded && (
              <div className="row-list-detail">
                {com.description && <p className="row-list-description">{com.description}</p>}
                {detail === 'loading' ? (
                  <span className="row-list-muted">
                    <Translation>Loading</Translation>
                  </span>
                ) : (
                  <div className="row-list-detail-grid">
                    <div>
                      <div className="row-list-detail-title">
                        <Translation>Properties</Translation>
                      </div>
                      <PropertyList properties={detail.properties} />
                    </div>
                    <div>
                      <div className="row-list-detail-title">
                        <Translation>Status</Translation>
                      </div>
                      {health.length === 0 ? (
                        <span className="row-list-muted">
                          <Translation>Not deployed</Translation>
                        </span>
                      ) : (
                        health.map((h) => (
                          <div key={h.env} className="component-status-line">
                            <span className="component-status-env">{h.env}</span>
                            <StatusBadge tone={h.health} label={healthLabels[h.health]} />
                            {h.message && <span className="row-list-muted">{h.message}</span>}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ComponentList;
