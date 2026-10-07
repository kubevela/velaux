import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { ReportChart } from './view';
import { chartRows, pieRows, statusColour } from './view';

const palette = ['#1b58f4', '#00b578', '#ff8f1f', '#7c3aed', '#e5484d', '#0ea5e9', '#d946ef', '#64748b'];
const colour = (i: number) => palette[i % palette.length];
// colourOf is a label's status colour, else the palette's i-th.
const colourOf = (label: string, i: number) => statusColour(label) || colour(i);
const axis = { fontSize: 11, fill: '#64748b' };

// ReportChartView draws a report's chart: bars (stacked by series, sideways
// where labels are many), a line per series, or a donut.
export const ReportChartView = (props: { chart: ReportChart }) => {
  const { chart } = props;
  const rows = chartRows(chart);
  const many = rows.length > 8;
  const legend = chart.series.length > 1;
  let body: React.ReactElement;
  if (chart.type === 'pie') {
    const series = chart.series[0];
    const slices = pieRows(chart, series);
    body = (
      <PieChart>
        <Pie
          data={slices}
          dataKey={series}
          animationBegin={0}
          animationDuration={500}
          nameKey="label"
          innerRadius="55%"
          outerRadius="85%"
          paddingAngle={1}
        >
          {slices.map((r, i) => (
            <Cell key={String(r.label)} fill={colourOf(String(r.label), i)} />
          ))}
        </Pie>
        <Tooltip />
        <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
      </PieChart>
    );
  } else if (chart.type === 'line') {
    body = (
      <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="label" tick={axis} />
        <YAxis tick={axis} allowDecimals={false} width={40} />
        <Tooltip />
        {legend && <Legend iconType="circle" />}
        {chart.series.map((s, i) => (
          <Line
            key={s}
            type="linear"
            dataKey={s}
            stroke={colourOf(s, i)}
            strokeWidth={2}
            dot={{ r: 3 }}
            animationBegin={0}
            animationDuration={500}
          />
        ))}
      </LineChart>
    );
  } else {
    body = (
      <BarChart
        data={rows}
        layout={many ? 'vertical' : 'horizontal'}
        margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
      >
        <CartesianGrid stroke="#e2e8f0" horizontal={!many} vertical={many} />
        {many ? (
          <>
            <XAxis type="number" tick={axis} allowDecimals={false} />
            <YAxis type="category" dataKey="label" tick={axis} width={160} interval={0} />
          </>
        ) : (
          <>
            <XAxis dataKey="label" tick={axis} interval={0} />
            <YAxis tick={axis} allowDecimals={false} width={40} />
          </>
        )}
        <Tooltip cursor={{ fill: '#f1f5f9' }} />
        {legend && <Legend iconType="circle" />}
        {chart.series.map((s, i) => (
          <Bar
            animationBegin={0}
            animationDuration={500}
            key={s}
            dataKey={s}
            stackId="all"
            fill={colourOf(s, i)}
            maxBarSize={36}
            radius={i === chart.series.length - 1 ? 3 : 0}
          />
        ))}
      </BarChart>
    );
  }
  const height = chart.type === 'bar' && many ? Math.min(28 * rows.length + 40, 520) : 240;
  return (
    <div className="report-chart">
      {chart.title && <div className="report-chart-title">{chart.title}</div>}
      <ResponsiveContainer width="100%" height={height}>
        {body}
      </ResponsiveContainer>
    </div>
  );
};
