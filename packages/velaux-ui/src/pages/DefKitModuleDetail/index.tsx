import { Button, Checkbox, Dialog, Message, Select } from '@alifd/next';
import { Link, routerRedux } from 'dva/router';
import { connect } from 'dva';
import React, { useCallback, useEffect, useState } from 'react';
import { AiOutlineArrowLeft, AiOutlineDown, AiOutlineRight } from 'react-icons/ai';
import { BsBoxes } from 'react-icons/bs';

import type {
  DefKitApplication,
  DefKitModuleDetail as Detail,
  DefKitPolicy,
  DefKitPreview,
  DefKitPreviewItem,
} from '@velaux/data';
import {
  applyDefKitPreview,
  deleteDefKitModule,
  detailDefKitModule,
  previewDefKitModule,
  updateDefKitModule,
} from '../../api/defkit';
import { DiffEditor } from '../../components/DiffEditor';
import { RelativeTime } from '../../components/RelativeTime';
import Empty from '../../components/Empty';
import Permission from '../../components/Permission';
import '../../components/RowList';
import { StatusBadge } from '../../components/StatusBadge';
import { Translation } from '../../components/Translation';
import i18n from '../../i18n';
import {
  autoText,
  busy,
  definitionLink,
  groupPreview,
  itemId,
  kindLabels,
  phaseLabels,
  phaseTones,
  policyLabels,
  sourceText,
  statusLabels,
  stepTone,
  withOverride,
} from '../DefKitModules/defkit';
import { ModuleDialog } from '../DefKitModules/ModuleDialog';
import '../DefKitModules/index.less';
import '../Packages/index.less';
import '../PackageDetail/index.less';

type Tab = 'definitions' | 'review' | 'application';

// ItemRow is one definition in a review. A changed or conflicting one opens to
// its diff, a new one to what it would be; conflicts and removals carry the
// review's choice.
const ItemRow = (props: { item: DefKitPreviewItem; checked?: boolean; onCheck?: (v: boolean) => void }) => {
  const { item } = props;
  const [open, setOpen] = useState(false);
  const canOpen = !!(item.next || item.current);
  const willDelete = item.status === 'removed' && item.policy === 'delete';
  const choice =
    item.status === 'conflict' ? 'Take over' : item.status === 'removed' && !willDelete ? 'Delete' : undefined;
  return (
    <div className="row-list-row">
      <div className="row-list-main">
        <span className="defkit-toggle">
          {canOpen && (
            <button type="button" className="defkit-expand" onClick={() => setOpen(!open)} aria-expanded={open}>
              {open ? <AiOutlineDown /> : <AiOutlineRight />}
            </button>
          )}
        </span>
        <span className="row-list-name">
          <span>
            <span className="row-list-title">{item.name}</span>
            <span className="row-list-type">{i18n.t(kindLabels[item.kind] || item.kind)}</span>
          </span>
        </span>
        <span className="defkit-description">{item.description}</span>
        <span>
          {choice && (
            <Checkbox checked={props.checked} onChange={(v: boolean) => props.onCheck && props.onCheck(v)}>
              <Translation>{choice}</Translation>
            </Checkbox>
          )}
          {willDelete && (
            <span className="defkit-will-delete" title={i18n.t('Its deletion policy is delete').toString()}>
              <Translation>Will be deleted</Translation>
            </span>
          )}
        </span>
      </div>
      {open && (
        <div className="defkit-diff">
          {item.current && item.next ? (
            <div className="defkit-diff-editor" id={`diff-${item.kind}-${item.name}`}>
              <DiffEditor id={`diff-${item.kind}-${item.name}`} base={item.current} target={item.next} />
            </div>
          ) : (
            <pre className="package-code">{item.next || item.current}</pre>
          )}
        </div>
      )}
    </div>
  );
};

// ModuleApplication is the Application a module is: its workflow's steps as
// far as they have run, and everything it tracks, render Jobs included. Its
// labels avoid "Application", which a deployment's terminology may rename.
const ModuleApplication = (props: { application: DefKitApplication }) => {
  const { application } = props;
  return (
    <div className="defkit-application">
      <div className="package-facts">
        <div>
          <span>
            <Translation>Name</Translation>
          </span>
          <code>
            {application.namespace}/{application.name}
          </code>
        </div>
        {application.phase && (
          <div>
            <span>
              <Translation>Phase</Translation>
            </span>
            <span>{application.phase}</span>
          </div>
        )}
      </div>
      <h3 className="defkit-section-title">
        <Translation>Workflow</Translation> <span className="package-tab-count">{application.steps.length}</span>
      </h3>
      {application.steps.length === 0 ? (
        <Empty message={<Translation>The workflow has not started</Translation>} />
      ) : (
        <div className="row-list defkit-steps">
          {application.steps.map((step) => (
            <div key={step.name} className="row-list-row">
              <div className="row-list-main">
                <span className="row-list-name">
                  <span>
                    <span className="row-list-title">{step.name}</span>
                    <span className="row-list-type">{step.type}</span>
                  </span>
                </span>
                <span>
                  <StatusBadge tone={stepTone(step.phase)} label={step.phase || 'pending'} />
                </span>
                <span className="defkit-description" title={step.message}>
                  {step.message}
                </span>
                <span>{step.endTime && <RelativeTime time={step.endTime} />}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <h3 className="defkit-section-title">
        <Translation>Resources</Translation> <span className="package-tab-count">{application.resources.length}</span>
      </h3>
      {application.resources.length === 0 ? (
        <Empty message={<Translation>Nothing tracked yet</Translation>} />
      ) : (
        <div className="row-list defkit-resources">
          <div className="row-list-head">
            <span>
              <Translation>Kind</Translation>
            </span>
            <span>
              <Translation>Name</Translation>
            </span>
            <span>
              <Translation>Namespace</Translation>
            </span>
          </div>
          {application.resources.map((r) => (
            <div key={`${r.kind}/${r.namespace}/${r.name}`} className="row-list-row">
              <div className="row-list-main">
                <span>{r.kind}</span>
                <span className="row-list-title">{r.name}</span>
                <span>{r.namespace}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Review is a module's pending render against the cluster, and its Apply.
const Review = (props: { name: string; preview?: DefKitPreview; onApplied: () => void }) => {
  const { preview } = props;
  const [takeOver, setTakeOver] = useState<Record<string, boolean>>({});
  const [remove, setRemove] = useState<Record<string, boolean>>({});
  const [applying, setApplying] = useState(false);
  if (!preview) {
    return null;
  }
  if (preview.phase === 'rendering') {
    return (
      <div className="defkit-waiting">
        <StatusBadge tone="progressing" label="Rendering" />
        <Translation>The module is rendering in a Job. This page updates when it is ready.</Translation>
      </div>
    );
  }
  if (preview.phase !== 'review') {
    return (
      <div className="defkit-waiting">
        <StatusBadge tone={phaseTones[preview.phase]} label={phaseLabels[preview.phase]} title={preview.message} />
        {preview.phase === 'failed' && preview.message ? (
          <span className="defkit-message">{preview.message}</span>
        ) : (
          <Translation>Nothing waiting for review. Update the module to render it again.</Translation>
        )}
      </div>
    );
  }
  const groups = groupPreview(preview.items);
  const changes = preview.items.filter((i) => i.status !== 'unchanged').length;
  const apply = () => {
    const picked = (m: Record<string, boolean>) => Object.keys(m).filter((k) => m[k]);
    const deleting = picked(remove);
    const run = () => {
      setApplying(true);
      applyDefKitPreview(props.name, picked(takeOver), deleting)
        .then((res: any) => {
          if (res) {
            Message.success(i18n.t('Applying the module').toString());
            props.onApplied();
          }
        })
        .finally(() => setApplying(false));
    };
    if (deleting.length === 0) {
      run();
      return;
    }
    Dialog.confirm({
      type: 'confirm',
      title: <Translation>Delete definitions</Translation>,
      content: (
        <span>
          <Translation>Applications using these definitions stop rendering</Translation>: {deleting.join(', ')}
        </span>
      ),
      onOk: run,
      locale: { ok: i18n.t('Delete').toString(), cancel: i18n.t('Cancel').toString() },
    });
  };
  return (
    <div>
      {preview.errors && preview.errors.length > 0 && (
        <div className="package-issue">
          <Translation>Some definitions could not be rendered</Translation>:
          <ul>
            {preview.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      {preview.info?.hasHooks && (
        <div className="package-issue">
          <Translation>
            This module has pre- or post-apply hooks, which are not run from here. Use vela def apply-module to run
            them.
          </Translation>
        </div>
      )}
      <div className="defkit-review-bar">
        <span>
          {changes} <Translation>changes</Translation> · {preview.items.length} <Translation>definitions</Translation>
        </span>
        <Permission request={{ resource: 'definition:*', action: 'update' }} project={''}>
          <Button type="primary" loading={applying} onClick={apply}>
            <Translation>Apply</Translation>
          </Button>
        </Permission>
      </div>
      {groups.map((g) => (
        <div key={g.status} className="defkit-group">
          <h3>
            <Translation>{statusLabels[g.status]}</Translation>{' '}
            <span className="package-tab-count">{g.items.length}</span>
          </h3>
          {g.status === 'conflict' && (
            <p className="defkit-hint">
              <Translation>Skipped unless taken over. Taking one over makes this module its owner.</Translation>
            </p>
          )}
          {g.status === 'removed' && (
            <p className="defkit-hint">
              <Translation>Kept unless ticked, except those whose deletion policy is delete.</Translation>
            </p>
          )}
          <div className="row-list defkit-items">
            {g.items.map((item) => {
              const id = itemId(item);
              const state = g.status === 'conflict' ? takeOver : remove;
              const setState = g.status === 'conflict' ? setTakeOver : setRemove;
              return (
                <ItemRow key={id} item={item} checked={!!state[id]} onCheck={(v) => setState({ ...state, [id]: v })} />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

// DefKitModuleDetail is a module: where it comes from, what it installed, and
// its pending render.
const DefKitModuleDetail = (props: {
  match: { params: { name: string } };
  location: { search: string };
  dispatch: (action: any) => void;
}) => {
  const { name } = props.match.params;
  const [detail, setDetail] = useState<Detail>();
  const [preview, setPreview] = useState<DefKitPreview>();
  const [tab, setTab] = useState<Tab>(props.location.search.includes('tab=review') ? 'review' : 'definitions');
  const [updating, setUpdating] = useState(false);
  const load = useCallback(() => {
    detailDefKitModule(name).then((res: any) => res && setDetail(res));
    previewDefKitModule(name).then((res: any) => res && setPreview(res));
  }, [name]);
  useEffect(load, [load]);
  const polling = busy(detail?.phase) || busy(preview?.phase);
  useEffect(() => {
    if (!polling) {
      return undefined;
    }
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [polling, load]);
  if (!detail) {
    return null;
  }
  const uninstall = () =>
    Dialog.confirm({
      type: 'confirm',
      title: <Translation>Uninstall module</Translation>,
      content: (
        <Translation>
          Its definitions are deleted with it, including any it took over. Applications using them stop rendering.
        </Translation>
      ),
      onOk: () =>
        deleteDefKitModule(name).then((res: any) => {
          if (res) {
            props.dispatch(routerRedux.push('/defkit'));
          }
        }),
      locale: { ok: i18n.t('Uninstall').toString(), cancel: i18n.t('Cancel').toString() },
    });
  // setPolicy changes one definition's deletion policy. It is a change to the
  // module's garbage-collect policy, so the module renders and applies again.
  const setPolicy = (id: string, policy?: DefKitPolicy) =>
    updateDefKitModule(name, detail.source, withOverride(detail.settings, id, policy)).then((res: any) => {
      if (res) {
        Message.success(
          i18n
            .t(
              detail.settings.autoUpdate
                ? 'Policy saved; the module renders and applies again'
                : 'Policy saved; the module renders again for review'
            )
            .toString()
        );
        load();
      }
    });
  const info = detail.info;
  return (
    <div className="package-detail defkit-detail">
      <Link className="package-back" to="/defkit">
        <AiOutlineArrowLeft /> <Translation>DefKit</Translation>
      </Link>
      <div className="package-head">
        <BsBoxes className="package-head-icon" />
        <h1>{detail.name}</h1>
        <StatusBadge tone={phaseTones[detail.phase]} label={phaseLabels[detail.phase]} title={detail.message} />
        <span className="defkit-head-actions">
          <Permission request={{ resource: 'definition:*', action: 'update' }} project={''}>
            <Button onClick={() => setUpdating(true)}>
              <Translation>Update</Translation>
            </Button>
          </Permission>
          <Permission request={{ resource: 'definition:*', action: 'delete' }} project={''}>
            <Button warning onClick={uninstall}>
              <Translation>Uninstall</Translation>
            </Button>
          </Permission>
        </span>
      </div>
      {info?.description && <p className="defkit-description-line">{info.description}</p>}
      <div className="package-facts">
        <div>
          <span>
            <Translation>Source</Translation>
          </span>
          <code>{sourceText(detail.source)}</code>
        </div>
        {info?.resolvedVersion && (
          <div>
            <span>
              <Translation>Rendered version</Translation>
            </span>
            <code>{info.resolvedVersion}</code>
          </div>
        )}
        {detail.source.prefix && (
          <div>
            <span>
              <Translation>Name prefix</Translation>
            </span>
            <code>{detail.source.prefix}</code>
          </div>
        )}
        <div>
          <span>
            <Translation>Deletion policy</Translation>
          </span>
          <span>
            <Translation>{policyLabels[detail.settings.deletionPolicy || 'retain']}</Translation>
          </span>
        </div>
        <div>
          <span>
            <Translation>Auto update</Translation>
          </span>
          {detail.settings.autoUpdate ? (
            <span>
              <Translation>Every</Translation> {autoText(detail.settings)}
              {detail.nextUpdate && (
                <span className="defkit-next">
                  {' · '}
                  <Translation>next</Translation> <RelativeTime time={detail.nextUpdate} />
                </span>
              )}
            </span>
          ) : (
            <Translation>Off</Translation>
          )}
        </div>
        {info?.maintainers && info.maintainers.length > 0 && (
          <div>
            <span>
              <Translation>Maintainers</Translation>
            </span>
            <span>{info.maintainers.map((m) => m.name).join(', ')}</span>
          </div>
        )}
        {info?.categories && info.categories.length > 0 && (
          <div>
            <span>
              <Translation>Categories</Translation>
            </span>
            <span>{info.categories.join(', ')}</span>
          </div>
        )}
      </div>
      <div className="package-tabs" role="tablist">
        {(['definitions', 'review', 'application'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? 'active' : ''}
            onClick={() => setTab(t)}
          >
            <Translation>{t === 'definitions' ? 'Definitions' : t === 'review' ? 'Review' : 'Status'}</Translation>{' '}
            <span className="package-tab-count">
              {t === 'definitions'
                ? detail.definitions.length
                : t === 'review' && preview?.phase === 'review'
                ? '•'
                : ''}
            </span>
          </button>
        ))}
      </div>
      {tab === 'definitions' &&
        (detail.definitions.length === 0 ? (
          <Empty message={<Translation>No definitions installed yet</Translation>} />
        ) : (
          <div className="row-list defkit-definitions">
            <div className="row-list-head">
              <span>
                <Translation>Name</Translation>
              </span>
              <span>
                <Translation>Type</Translation>
              </span>
              <span>
                <Translation>Description</Translation>
              </span>
              <span>
                <Translation>On removal</Translation>
              </span>
            </div>
            {detail.definitions.map((d) => (
              <div key={itemId(d)} className="row-list-row">
                <div className="row-list-main">
                  <Link className="row-list-name" to={definitionLink(d.kind, d.name)}>
                    <span className="row-list-title">{d.name}</span>
                  </Link>
                  <span>{i18n.t(kindLabels[d.kind] || d.kind)}</span>
                  <span className="defkit-description">{d.description}</span>
                  <span>
                    <Select
                      size="small"
                      className="defkit-policy"
                      value={detail.settings.overrides?.[itemId(d)] || 'default'}
                      onChange={(v: string) => setPolicy(itemId(d), v === 'default' ? undefined : (v as DefKitPolicy))}
                      dataSource={[
                        {
                          value: 'default',
                          label: `${i18n.t('Module').toString()} (${i18n
                            .t(policyLabels[detail.settings.deletionPolicy || 'retain'])
                            .toString()
                            .toLowerCase()})`,
                        },
                        { value: 'retain', label: i18n.t('Retain').toString() },
                        { value: 'delete', label: i18n.t('Delete').toString() },
                      ]}
                    />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))}
      {tab === 'application' && detail.application && <ModuleApplication application={detail.application} />}
      {tab === 'review' && (
        <Review
          name={name}
          preview={preview}
          onApplied={() => {
            setTab('definitions');
            load();
          }}
        />
      )}
      {updating && (
        <ModuleDialog
          module={detail}
          onClose={() => setUpdating(false)}
          onDone={() => {
            setUpdating(false);
            setTab('review');
            load();
          }}
        />
      )}
    </div>
  );
};

export default connect()(DefKitModuleDetail);
