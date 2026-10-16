import { Button, Field, Loading, Message, Table } from '@alifd/next';
import { connect } from 'dva';
import { Link } from 'dva/router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AiOutlineDownload } from 'react-icons/ai';
import { HiOutlineRefresh } from 'react-icons/hi';

import type { UIParam } from '@velaux/data';

import { listReports, runReport } from '../../api/report';
import Empty from '../../components/Empty';
import { ListTitle } from '../../components/ListTitle';
import { recordStatus } from '../../components/PipelineGraph/status';
import { StatusBadge } from '../../components/StatusBadge';
import { Translation } from '../../components/Translation';
import UISchema from '../../components/UISchema';
import i18n from '../../i18n';
import { momentDate } from '../../utils/common';
import { allProjects } from '../../utils/currentProject';
import { locale } from '../../utils/locale';
import { ReportChartView } from './chart';
import { toCSV } from './csv';
import type { ReportChart, ReportFormat } from './view';
import { formatCell, latestOnly } from './view';
import './index.less';

type ReportMeta = {
  id: string;
  title: string;
  description: string;
  scope: 'local' | 'global';
  hidden?: boolean;
  error?: string;
  parameters?: UIParam[];
};
type ReportStat = { label: string; value: any; format?: ReportFormat; tone?: string };
type ReportResult = {
  report: ReportMeta;
  generatedAt: string;
  stats?: ReportStat[];
  columns: Array<{ key: string; title: string; format?: ReportFormat }>;
  rows: Array<{ values: Record<string, any>; links?: Record<string, string> }>;
  chart?: ReportChart;
};

// key tells a project's own report from a global one of the same name.
const key = (r: ReportMeta) => `${r.scope}/${r.id}`;

const Cell = (props: { value: any; format?: ReportFormat; link?: string }) => {
  if (props.format === 'badge' && props.value) {
    const status = recordStatus(String(props.value));
    return <StatusBadge tone={status.tone} label={status.label} />;
  }
  const text = formatCell(props.value, props.format);
  return props.link ? <Link to={props.link}>{text}</Link> : <>{text}</>;
};

// Stats are a report's headline numbers, as tiles. A report's own text is
// shown as its author wrote it, not looked up as a translation.
const Stats = (props: { stats: ReportStat[] }) => (
  <div className="report-stats">
    {props.stats.map((s) => (
      <div key={s.label} className={`report-stat tone-${s.tone || 'neutral'}`}>
        <div className="report-stat-value">
          {s.value === null || s.value === undefined ? '-' : formatCell(s.value, s.format)}
        </div>
        <div className="report-stat-label">{s.label}</div>
      </div>
    ))}
  </div>
);

// Reports runs reports over the project picked in the top bar: the project's
// own, then the global ones.
const ReportsView = (props: { currentProject?: { current: string; resolved: boolean } }) => {
  const project = props.currentProject?.resolved ? props.currentProject.current : undefined;
  const [catalogue, setCatalogue] = useState<ReportMeta[]>([]);
  const [globalUnavailable, setGlobalUnavailable] = useState(false);
  const [selected, setSelected] = useState<string>();
  const [result, setResult] = useState<ReportResult>();
  const [failure, setFailure] = useState<string>();
  const [loading, setLoading] = useState(false);
  const track = useMemo(() => latestOnly(), []);
  const field = Field.useField();
  const form = useRef<UISchema>(null);
  const report = catalogue.find((r) => key(r) === selected);

  useEffect(() => {
    setResult(undefined);
    setCatalogue([]);
    if (!project || project === allProjects) {
      return;
    }
    listReports(project).then((res: any) => {
      const reports: ReportMeta[] = res?.reports || [];
      setCatalogue(reports);
      setGlobalUnavailable(!!res?.globalUnavailable);
      const first = reports.find((r) => !r.hidden);
      setSelected((current) => (current && reports.some((r) => key(r) === current) ? current : first && key(first)));
    });
  }, [project]);

  const run = useCallback(
    (parameters?: Record<string, any>) => {
      setResult(undefined);
      setFailure(undefined);
      if (!project || !report || report.error) {
        return;
      }
      setLoading(true);
      track(runReport(project, report.id, parameters))
        .then((res: any) => {
          if (res?.report) {
            setResult({ ...res, rows: res.rows || [] });
          } else {
            setFailure(res?.Message || i18n.t('The report failed').toString());
          }
        })
        .catch((err: any) => setFailure(err?.Message || String(err)))
        .finally(() => setLoading(false));
    },
    [project, report, track]
  );
  useEffect(() => {
    field.reset();
    run();
  }, [field, run]);

  const runWithParameters = () => {
    const values = field.getValue<Record<string, any>>('parameters');
    if (!form.current) {
      run(values);
      return;
    }
    form.current.validate((error?: string) => !error && run(values));
  };

  const download = () => {
    if (!result) {
      return;
    }
    const blob = new Blob([toCSV(result.columns, result.rows)], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${project}-${result.report.id}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const group = (scope: ReportMeta['scope'], title: string) => {
    const reports = catalogue.filter((r) => r.scope === scope);
    if (reports.length === 0) {
      return null;
    }
    return (
      <div className="reports-group">
        <div className="reports-group-title">
          <Translation>{title}</Translation>
        </div>
        {reports.map((r) => (
          <button
            key={key(r)}
            type="button"
            disabled={r.hidden}
            className={`reports-item ${selected === key(r) ? 'active' : ''} ${r.hidden ? 'hidden' : ''} ${
              r.error ? 'invalid' : ''
            }`}
            title={r.hidden ? i18n.t("Hidden by this project's report of the same name").toString() : undefined}
            onClick={() => setSelected(key(r))}
          >
            <span className="reports-item-title">{r.title}</span>
            <span className="reports-item-description">
              {r.hidden ? (
                <Translation>{"Hidden by this project's report of the same name"}</Translation>
              ) : r.error ? (
                <Translation>Not a valid report</Translation>
              ) : (
                r.description
              )}
            </span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="reports">
      <ListTitle
        title="Reports"
        subTitle="Questions about the picked project, answered from its applications and namespaces."
      />
      {project === allProjects ? (
        <Empty
          message={<Translation>Pick a project in the top bar. Reports run over one project at a time.</Translation>}
        />
      ) : (
        <div className="reports-body">
          <nav className="reports-catalogue">
            {group('local', 'This project')}
            {group('global', 'Global')}
            {globalUnavailable && (
              <div className="reports-note">
                <Translation>Global reports could not be loaded.</Translation>
              </div>
            )}
          </nav>
          <section className="reports-result">
            <div className="reports-result-head">
              <div>
                <div className="reports-result-title">
                  {report?.title}
                  {report?.scope === 'global' && (
                    <span className="reports-scope">
                      <Translation>Global</Translation>
                    </span>
                  )}
                </div>
                {report?.description && <div className="reports-result-description">{report.description}</div>}
                {result && (
                  <div className="reports-result-meta">
                    {result.rows.length} <Translation>rows</Translation> · <Translation>generated</Translation>{' '}
                    {momentDate(result.generatedAt)}
                  </div>
                )}
              </div>
              <div className="reports-result-actions">
                <Button onClick={runWithParameters} title={i18n.t('Run again').toString()} disabled={!!report?.error}>
                  <HiOutlineRefresh />
                </Button>
                <Button onClick={download} disabled={!result || result.rows.length === 0}>
                  <AiOutlineDownload />
                  <Translation>Export CSV</Translation>
                </Button>
              </div>
            </div>
            {report?.error && (
              <Message type="error" className="reports-message">
                {report.error}
              </Message>
            )}
            {failure && (
              <Message type="error" className="reports-message">
                {failure}
              </Message>
            )}
            {report && !report.error && report.parameters && report.parameters.length > 0 && (
              <div className="reports-parameters">
                <UISchema
                  key={selected}
                  {...field.init('parameters')}
                  ref={form}
                  uiSchema={report.parameters}
                  definition={{ type: 'report', name: report.id, description: report.description }}
                  mode="new"
                  maxColSpan={12}
                />
                <Button type="primary" onClick={runWithParameters}>
                  <Translation>Run</Translation>
                </Button>
              </div>
            )}
            <Loading visible={loading} style={{ width: '100%' }}>
              {result?.stats && result.stats.length > 0 && <Stats stats={result.stats} />}
              {result?.chart && result.rows.length > 0 && <ReportChartView chart={result.chart} />}
              <Table locale={locale().Table} dataSource={result?.rows || []}>
                {(result?.columns || []).map((col) => (
                  <Table.Column
                    key={col.key}
                    title={col.title}
                    dataIndex={col.key}
                    cell={(_: any, __: number, row: ReportResult['rows'][number]) => (
                      <Cell value={row.values[col.key]} format={col.format} link={row.links?.[col.key]} />
                    )}
                  />
                ))}
              </Table>
            </Loading>
          </section>
        </div>
      )}
    </div>
  );
};

export default connect((store: any) => ({ currentProject: store.currentProject }))(ReportsView);
