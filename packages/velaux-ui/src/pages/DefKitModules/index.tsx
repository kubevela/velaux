import { Button } from '@alifd/next';
import { Link, routerRedux } from 'dva/router';
import React, { useCallback, useEffect, useState } from 'react';
import { connect } from 'dva';
import { BsBoxes } from 'react-icons/bs';

import type { DefKitModule } from '@velaux/data';
import { listDefKitModules } from '../../api/defkit';
import Empty from '../../components/Empty';
import { ListTitle } from '../../components/ListTitle';
import Permission from '../../components/Permission';
import { RelativeTime } from '../../components/RelativeTime';
import '../../components/RowList';
import { StatusBadge } from '../../components/StatusBadge';
import { Translation } from '../../components/Translation';
import i18n from '../../i18n';
import '../Packages/index.less';
import { autoText, busy, kindLabels, phaseLabels, phaseTones, sourceText } from './defkit';
import { ModuleDialog } from './ModuleDialog';
import './index.less';

// countsText is a module's installed definitions by kind, as one line.
const countsText = (counts: Record<string, number>) =>
  Object.keys(kindLabels)
    .filter((k) => counts[k])
    .map((k) => `${counts[k]} ${i18n.t(kindLabels[k]).toString().toLowerCase()}`)
    .join(' · ');

// DefKitModules lists the DefKit modules installed as Applications of the
// defkit addon.
const DefKitModules = (props: { dispatch: (action: any) => void }) => {
  const [modules, setModules] = useState<DefKitModule[]>([]);
  const [addonEnabled, setAddonEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const load = useCallback(
    () =>
      listDefKitModules()
        .then((res: any) => {
          setModules(res?.modules || []);
          setAddonEnabled(!!res?.addonEnabled);
        })
        .finally(() => setLoading(false)),
    []
  );
  useEffect(() => {
    load();
  }, [load]);
  const anyBusy = modules.some((m) => busy(m.phase));
  useEffect(() => {
    if (!anyBusy) {
      return undefined;
    }
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [anyBusy, load]);
  return (
    <div className="packages defkit">
      <ListTitle
        title="DefKit"
        subTitle="Definition modules written in Go with DefKit, rendered and reviewed before they install"
        extButtons={[
          <Permission key="add" request={{ resource: 'definition:*', action: 'create' }} project={''}>
            <Button type="primary" disabled={!addonEnabled} onClick={() => setAdding(true)}>
              <Translation>Add module</Translation>
            </Button>
          </Permission>,
        ]}
      />
      <div className="defkit-experimental">
        <span className="defkit-experimental-pill">
          <Translation>Experimental</Translation>
        </span>
        <Translation>
          Each module installs through its own workflow in vela-system, so its definitions are tracked and garbage
          collected like any other resource.
        </Translation>
      </div>
      {!loading && !addonEnabled && (
        <div className="package-issue">
          <Translation>Enable the defkit addon to install DefKit modules</Translation>
          {' · '}
          <Link to="/addons">
            <Translation>Addons</Translation>
          </Link>
        </div>
      )}
      {!loading && modules.length === 0 ? (
        <Empty message={<Translation>No DefKit modules</Translation>} />
      ) : (
        <div className="row-list defkit-list">
          <div className="row-list-head">
            <span>
              <Translation>Name</Translation>
            </span>
            <span>
              <Translation>Source</Translation>
            </span>
            <span>
              <Translation>Status</Translation>
            </span>
            <span>
              <Translation>Definitions</Translation>
            </span>
            <span>
              <Translation>Updated</Translation>
            </span>
          </div>
          {modules.map((m) => (
            <div key={m.name} className="row-list-row">
              <div className="row-list-main">
                <Link className="row-list-name" to={`/defkit/${m.name}`}>
                  <BsBoxes className="row-list-icon" />
                  <span>
                    <span className="row-list-title">{m.name}</span>
                    <span className="row-list-type">{m.info?.description || m.info?.name}</span>
                  </span>
                </Link>
                <span>
                  <code className="row-list-code" title={sourceText(m.source)}>
                    {sourceText(m.source)}
                  </code>
                </span>
                <span>
                  {m.phase === 'review' ? (
                    <Link to={`/defkit/${m.name}?tab=review`}>
                      <StatusBadge tone={phaseTones[m.phase]} label={phaseLabels[m.phase]} />
                    </Link>
                  ) : (
                    <StatusBadge tone={phaseTones[m.phase]} label={phaseLabels[m.phase]} title={m.message} />
                  )}
                  {m.settings?.autoUpdate && (
                    <span className="defkit-auto">
                      <Translation>Auto update every</Translation> {autoText(m.settings)}
                    </span>
                  )}
                </span>
                <span>{countsText(m.counts) || '-'}</span>
                <span>
                  <RelativeTime time={m.updateTime} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      {adding && (
        <ModuleDialog
          onClose={() => setAdding(false)}
          onDone={(name) => {
            setAdding(false);
            props.dispatch(routerRedux.push(`/defkit/${name}?tab=review`));
          }}
        />
      )}
    </div>
  );
};

export default connect()(DefKitModules);
