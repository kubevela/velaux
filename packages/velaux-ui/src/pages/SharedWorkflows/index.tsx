import { Balloon, Button, Dialog, Input, Message } from '@alifd/next';
import { connect } from 'dva';
import { Link, routerRedux } from 'dva/router';
import React, { useCallback, useEffect, useState } from 'react';
import { AiOutlineCopy, AiOutlineDelete, AiOutlineEdit, AiOutlineEye, AiOutlineSearch } from 'react-icons/ai';
import { BsDiagram3 } from 'react-icons/bs';

import type { ListSharedWorkflowsResponse, LoginUserInfo, SharedWorkflow } from '@velaux/data';
import { deleteSharedWorkflow, listSharedWorkflows } from '../../api/sharedWorkflows';
import Empty from '../../components/Empty';
import { ListTitle } from '../../components/ListTitle';
import { RowAction } from '../../components/RowAction';
import '../../components/RowList';
import { StatusBadge } from '../../components/StatusBadge';
import { Translation } from '../../components/Translation';
import { SettingsSummary } from '../../components/WorkflowStudio/settings';
import i18n from '../../i18n';
import { allProjects } from '../../utils/currentProject';
import { locale } from '../../utils/locale';
import type { SharedUsage, SharedWhere } from '../../utils/sharedWorkflows';
import { filterShared, inUse } from '../../utils/sharedWorkflows';
import type { SharedWorkflowDraft } from './draft';
import { canChange, canCreate, studioPath } from './draft';
import type { NewSharedWorkflow } from './NewDialog';
import { NewDialog } from './NewDialog';
import '../Packages/index.less';
import './index.less';

type Props = {
  dispatch: (action: any) => void;
  currentProject?: { current: string; resolved: boolean };
  userInfo?: LoginUserInfo;
};

// UsedBy says what runs a shared workflow: the project's workflows by name on
// hover, other projects' as a count.
const UsedBy = (props: { workflow: SharedWorkflow }) => {
  const used = props.workflow.usedBy || [];
  const elsewhere = props.workflow.usedElsewhere || 0;
  if (used.length === 0 && elsewhere === 0) {
    return (
      <span className="row-list-muted">
        <Translation>Not used</Translation>
      </span>
    );
  }
  const text = (
    <span>
      {used.length > 0 && `${used.length} ${i18n.t(used.length === 1 ? 'workflow' : 'workflows').toString()}`}
      {used.length > 0 && elsewhere > 0 && ' · '}
      {elsewhere > 0 && `${elsewhere} ${i18n.t('in other projects').toString()}`}
    </span>
  );
  if (used.length === 0) {
    return text;
  }
  return (
    <Balloon trigger={<span className="shared-used-by">{text}</span>} closable={false} align="b">
      <ul className="shared-used-list">
        {used.map((u) => (
          <li key={`${u.appName}/${u.workflowName}`}>
            <Link to={`/applications/${u.appName}/envbinding/${u.envName}/workflow`}>{u.appAlias || u.appName}</Link>
            <span className="row-list-muted">
              {' '}
              · {u.workflowAlias || u.workflowName} · {u.envName}
            </span>
          </li>
        ))}
      </ul>
    </Balloon>
  );
};

// SharedWorkflows lists the shared workflows the picked project's
// applications can use: its own, in its namespace, and the global ones.
const SharedWorkflows = (props: Props) => {
  const project = props.currentProject?.resolved ? props.currentProject.current : undefined;
  const [list, setList] = useState<ListSharedWorkflowsResponse>();
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [where, setWhere] = useState<SharedWhere>('all');
  const [usage, setUsage] = useState<SharedUsage>('all');
  // creating is the dialog's starting values, with the workflow being copied.
  const [creating, setCreating] = useState<{ initial: NewSharedWorkflow; from?: SharedWorkflow }>();

  const load = useCallback(() => {
    if (!project) {
      return;
    }
    setLoading(true);
    listSharedWorkflows(project)
      .then((res: ListSharedWorkflowsResponse) => setList(res))
      .finally(() => setLoading(false));
  }, [project]);
  useEffect(load, [load]);

  if (!project) {
    return null;
  }
  const canProject = canCreate(project, 'project', props.userInfo);
  const canGlobal = canCreate(project, 'global', props.userInfo);

  const remove = (w: SharedWorkflow) =>
    Dialog.confirm({
      type: 'confirm',
      content: (
        <span>
          <Translation>Delete the shared workflow</Translation> <code>{w.name}</code>?
        </span>
      ),
      onOk: () =>
        deleteSharedWorkflow(project, w.scope, w.name).then((res: any) => {
          if (res) {
            Message.success(i18n.t('Shared workflow deleted').toString());
            load();
          }
        }),
      locale: locale().Dialog,
    });

  const open = (values: NewSharedWorkflow, from?: SharedWorkflow) => {
    const draft: SharedWorkflowDraft = {
      ...values,
      project,
      namespace: values.scope === 'project' ? list?.projectNamespace : 'vela-system',
      description: from?.description,
      mode: from?.mode,
      subMode: from?.subMode,
      steps: from?.steps || [],
    };
    setCreating(undefined);
    props.dispatch(routerRedux.push({ pathname: '/shared-workflows/new', state: draft }));
  };

  const workflows = list?.workflows || [];
  const shown = filterShared(workflows, query, where, usage);
  // segmented is a filter as a row of buttons, one of them pressed.
  const segmented = <T extends string>(label: string, value: T, set: (v: T) => void, options: [T, string][]) => (
    <div className="packages-source" role="group" aria-label={i18n.t(label).toString()}>
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          className={value === v ? 'active' : ''}
          aria-pressed={value === v}
          onClick={() => set(v)}
        >
          <Translation>{text}</Translation>
        </button>
      ))}
    </div>
  );
  return (
    <div className="shared-workflows">
      <ListTitle
        title="Workflows"
        subTitle="Workflows the project's applications can run in place of their own steps"
        extButtons={[
          <Button
            key="new"
            type="primary"
            disabled={!canProject && !canGlobal}
            onClick={() => setCreating({ initial: { name: '', scope: canProject ? 'project' : 'global' } })}
          >
            <Translation>New Workflow</Translation>
          </Button>,
        ]}
      />
      {project === allProjects ? (
        <Empty
          message={
            <Translation>Pick a project in the top bar. Each project has shared workflows of its own.</Translation>
          }
        />
      ) : !loading && workflows.length === 0 ? (
        <Empty message={<Translation>No shared workflows for this project, nor global ones</Translation>} />
      ) : (
        <>
          <div className="packages-toolbar">
            <Input
              innerBefore={<AiOutlineSearch className="packages-search-icon" />}
              hasClear
              placeholder={i18n.t('Search by name, alias or description').toString()}
              value={query}
              onChange={(v) => setQuery(v)}
              className="packages-search"
            />
            {segmented<SharedWhere>('Where', where, setWhere, [
              ['all', 'All'],
              ['project', 'Project'],
              ['global', 'Global'],
            ])}
            {segmented<SharedUsage>('Usage', usage, setUsage, [
              ['all', 'All'],
              ['used', 'In use'],
              ['unused', 'Not used'],
            ])}
          </div>
          {shown.length === 0 ? (
            <Empty message={<Translation>No workflows match the filters</Translation>} />
          ) : (
            <div className="row-list shared-workflow-list">
              <div className="row-list-head">
                <span>
                  <Translation>Name</Translation>
                </span>
                <span>
                  <Translation>Where</Translation>
                </span>
                <span>
                  <Translation>Runs</Translation>
                </span>
                <span>
                  <Translation>Used by</Translation>
                </span>
                <span />
              </div>
              {list?.globalUnavailable && (
                <div className="row-list-row shared-notice">
                  <Translation>Global shared workflows could not be loaded.</Translation>
                </div>
              )}
              {shown.map((w) => {
                const editable = canChange(project, w.scope, props.userInfo);
                return (
                  <div key={`${w.scope}/${w.name}`} className={`row-list-row ${w.hidden ? 'shared-hidden' : ''}`}>
                    <div className="row-list-main">
                      <Link className="row-list-name" to={studioPath(project, w.scope, w.name)}>
                        <BsDiagram3 className="row-list-icon" />
                        <span>
                          <span className="row-list-title">{w.alias || w.name}</span>
                          <span className="row-list-type">
                            {w.alias ? w.name : ''}
                            {w.alias && w.description ? ' · ' : ''}
                            {w.description}
                          </span>
                        </span>
                      </Link>
                      <span>
                        <StatusBadge
                          tone={w.scope === 'global' ? 'neutral' : 'progressing'}
                          label={w.scope === 'global' ? 'Global' : 'Project'}
                        />
                        {w.hidden && (
                          <span className="row-list-muted shared-hidden-note">
                            <Translation>{"hidden by the project's"}</Translation>
                          </span>
                        )}
                      </span>
                      <span>
                        <SettingsSummary mode={w.mode || 'StepByStep'} subMode={w.subMode || 'DAG'} />
                        <span className="row-list-muted">
                          {' · '}
                          {w.steps.length} {i18n.t(w.steps.length === 1 ? 'step' : 'steps').toString()}
                        </span>
                      </span>
                      <span>
                        <UsedBy workflow={w} />
                      </span>
                      <span className="row-list-actions">
                        <Link to={studioPath(project, w.scope, w.name)}>
                          <RowAction
                            icon={editable ? <AiOutlineEdit /> : <AiOutlineEye />}
                            label={editable ? 'Edit' : 'View'}
                          />
                        </Link>
                        {(canProject || canGlobal) && (
                          <RowAction
                            icon={<AiOutlineCopy />}
                            label="Copy"
                            onClick={() =>
                              setCreating({
                                initial: {
                                  name: `${w.name}-copy`,
                                  alias: w.alias,
                                  scope: canProject ? 'project' : 'global',
                                },
                                from: w,
                              })
                            }
                          />
                        )}
                        {editable && (
                          <RowAction
                            icon={<AiOutlineDelete />}
                            label={inUse(w) ? 'In use, so it cannot be deleted' : 'Delete'}
                            danger
                            disabled={inUse(w)}
                            onClick={() => remove(w)}
                          />
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      {creating && (
        <NewDialog
          copyOf={creating.from?.name}
          initial={creating.initial}
          canProject={canProject}
          canGlobal={canGlobal}
          onClose={() => setCreating(undefined)}
          onOk={(values) => open(values, creating.from)}
        />
      )}
    </div>
  );
};

export default connect((store: any) => ({ currentProject: store.currentProject, userInfo: store.user?.userInfo }))(
  SharedWorkflows
);
