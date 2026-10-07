import { Balloon } from '@alifd/next';
import React, { useEffect, useState } from 'react';
import { AiOutlineDown, AiOutlineImport, AiOutlineRight } from 'react-icons/ai';

import '../../../../components/RowList';
import { StatusBadge } from '../../../../components/StatusBadge';
import { Translation } from '../../../../components/Translation';
import type { ApplicationSourceStatus } from '@velaux/data';
import { momentDate } from '../../../../utils/common';
import { nextExpiry, sourcePhase, sourceReads, timeLeft } from '../../../../utils/sourceStatus';
import './index.less';

// Expiry is the time left before a source's value expires, or that it is due a refresh.
const Expiry = (props: { at?: Date; now: Date }) => {
  if (!props.at) {
    return <span className="row-list-muted">-</span>;
  }
  const left = timeLeft(props.at, props.now);
  return (
    <span title={momentDate(props.at.toISOString())} className={left ? '' : 'source-status-due'}>
      {left ? (
        <span>
          <Translation>Expires in</Translation> {left}
        </span>
      ) : (
        <Translation>Refresh due</Translation>
      )}
    </span>
  );
};

// Phase is a source's or an entry's phase as a badge, its message on hover.
const Phase = (props: { phase?: string; message?: string }) => {
  const { label, tone } = sourcePhase(props.phase);
  return <StatusBadge tone={tone} label={label} title={props.message} />;
};

// SourceStatusList is how an environment's sources resolved: whether each value is
// fresh, how long it has left, whether a change re-dispatches its readers, and
// what they read. A row expands to its cache entries and the values read.
const SourceStatusList = (props: { sources: ApplicationSourceStatus[] }) => {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);
  const toggle = (name: string) => setOpen({ ...open, [name]: !open[name] });
  return (
    <div className="row-list source-status-list">
      <div className="row-list-head">
        <span />
        <span>
          <Translation>Name</Translation>
        </span>
        <span>
          <Translation>Data</Translation>
        </span>
        <span>
          <Translation>Expires</Translation>
        </span>
        <span>
          <Translation>Auto Update</Translation>
        </span>
        <span>
          <Translation>Read by</Translation>
        </span>
      </div>
      {props.sources.map((source) => {
        const expanded = !!open[source.name];
        const reads = sourceReads(source);
        const readers = new Set(reads.map((r) => r.reader));
        const failing = (source.resolutions || []).find((r) => r.message)?.message;
        return (
          <div key={source.name} className={`row-list-row ${expanded ? 'expanded' : ''}`}>
            <div className="row-list-main">
              <span className="row-list-chevron" onClick={() => toggle(source.name)}>
                {expanded ? <AiOutlineDown /> : <AiOutlineRight />}
              </span>
              <span className="row-list-name" onClick={() => toggle(source.name)}>
                <AiOutlineImport className="row-list-icon" />
                <span>
                  <span className="row-list-title">{source.name}</span>
                  <span className="row-list-type">{source.type}</span>
                </span>
              </span>
              <span>
                <Phase phase={source.phase} message={failing} />
              </span>
              <span>
                <Expiry at={nextExpiry(source.resolutions)} now={now} />
              </span>
              <span>
                {source.autoUpdate === undefined ? (
                  <span className="row-list-muted">-</span>
                ) : source.message ? (
                  <Balloon.Tooltip
                    align="t"
                    trigger={
                      <span className="source-status-hint">
                        <Translation>{source.autoUpdate ? 'On' : 'Off'}</Translation>
                      </span>
                    }
                  >
                    {source.message}
                  </Balloon.Tooltip>
                ) : (
                  <Translation>{source.autoUpdate ? 'On' : 'Off'}</Translation>
                )}
              </span>
              <span>
                {readers.size === 0 ? (
                  <span className="row-list-muted">
                    <Translation>Nothing</Translation>
                  </span>
                ) : (
                  Array.from(readers).join(', ')
                )}
              </span>
            </div>
            {expanded && (
              <div className="row-list-detail">
                {source.message && <p className="row-list-description">{source.message}</p>}
                <div className="row-list-detail-title">
                  <Translation>Values read</Translation>
                </div>
                {reads.length === 0 ? (
                  <span className="row-list-muted">
                    <Translation>Nothing reads this source</Translation>
                  </span>
                ) : (
                  <table className="source-status-table">
                    <thead>
                      <tr>
                        <th>
                          <Translation>Attribute</Translation>
                        </th>
                        <th>
                          <Translation>Value</Translation>
                        </th>
                        <th>
                          <Translation>Reader</Translation>
                        </th>
                        <th>
                          <Translation>Property</Translation>
                        </th>
                        <th>
                          <Translation>Placement</Translation>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reads.map((r, i) => (
                        <tr key={`${r.reader}-${r.attr}-${r.property}-${r.placement}-${i}`}>
                          <td>
                            <code className="row-list-code">{r.attr || '-'}</code>
                          </td>
                          <td className="source-status-value" title={r.value}>
                            {r.value === undefined ? (
                              <span className="row-list-muted">
                                <Translation>Withheld</Translation>
                              </span>
                            ) : (
                              r.value
                            )}
                          </td>
                          <td>
                            {r.reader}
                            <span className="row-list-muted"> {r.readerType || r.readerKind}</span>
                          </td>
                          <td>
                            <code className="row-list-code">{r.property || '-'}</code>
                          </td>
                          <td>{r.placement || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <div className="row-list-detail-title source-status-entries">
                  <Translation>Cache entries</Translation>
                </div>
                <table className="source-status-table">
                  <thead>
                    <tr>
                      <th>
                        <Translation>Storage Key</Translation>
                      </th>
                      <th>
                        <Translation>Clusters</Translation>
                      </th>
                      <th>
                        <Translation>Data</Translation>
                      </th>
                      <th>
                        <Translation>Expires</Translation>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(source.resolutions || []).map((r) => (
                      <tr key={r.storageKey || r.clusters?.join(',')}>
                        <td>
                          <code className="row-list-code">{r.storageKey || '-'}</code>
                        </td>
                        <td>{(r.clusters || []).join(', ') || '-'}</td>
                        <td>
                          <Phase phase={r.phase} message={r.message} />
                        </td>
                        <td>
                          <Expiry at={nextExpiry([r])} now={now} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SourceStatusList;
