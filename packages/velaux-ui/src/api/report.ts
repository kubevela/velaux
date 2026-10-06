import { getDomain } from '../utils/common';
import { get, post } from './request';

const projects = `${getDomain().APIBASE}/api/v1/projects`;

// listReports is the catalogue of reports a project can run: its own, then the
// global ones.
export function listReports(project: string) {
  return get(`${projects}/${project}/reports`, {}).then((res) => res);
}

// runReport runs a report over one project with the given parameters.
export function runReport(project: string, id: string, parameters?: Record<string, any>) {
  return post(`${projects}/${project}/reports/${id}`, { parameters }).then((res) => res);
}
