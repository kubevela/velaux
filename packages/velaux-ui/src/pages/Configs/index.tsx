import { Table, Button, Dialog, Message, Tag, Balloon, Input, Select } from '@alifd/next';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { Component, Fragment } from 'react';
import { AiOutlineDelete, AiOutlineSearch, AiOutlineSend } from 'react-icons/ai';
import { HiOutlineRefresh } from 'react-icons/hi';

import { getConfigs, getProjectConfigs, deleteConfig, listTemplates } from '../../api/config';
import Empty from '../../components/Empty';
import { ListTitle } from '../../components/ListTitle';
import Permission from '../../components/Permission';
import { RowAction } from '../../components/RowAction';
import { StatusBadge } from '../../components/StatusBadge';
import { Translation } from '../../components/Translation';
import i18n from '../../i18n';
import type { ConfigTemplate, Config, LoginUserInfo } from '@velaux/data';
import { momentDate } from '../../utils/common';
import { allProjects, projectChanged } from '../../utils/currentProject';
import { locale } from '../../utils/locale';
import DistributeConfigDialog from '../ProjectSummary/components/Configs/config-distribute';
import CreateConfigDialog from './components/CreateConfigDialog';
import { templateIcon } from './icons';
import { templateFilterItems, templateOptions } from './templates';
import './index.less';

type Props = {
  userInfo?: LoginUserInfo;
  location?: { search?: string };
  dispatch: ({}) => {};
  // scope project lists the configs of the project picked in the top bar, and
  // the global ones shared with it; without it, the global configs.
  scope?: 'project';
  currentProject?: { current: string; resolved: boolean };
};

type State = {
  list: Config[];
  templates: ConfigTemplate[];
  // template filters the list to one template's configs; empty is all.
  template: string;
  query: string;
  // open is the config the dialog shows, or new for a config not yet made.
  open?: { name?: string; template?: string; templateNamespace?: string };
  // distribution is the legacy project config being distributed to targets.
  distribution?: Config;
  isLoading: boolean;
};

// templateParam is the template a link to the list filters it to.
function templateParam(search?: string): string {
  return new URLSearchParams(search || '').get('template') || '';
}

@connect((store: any) => {
  return { ...store.user, currentProject: store.currentProject };
})
class Configs extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      list: [],
      templates: [],
      template: templateParam(props.location?.search),
      query: '',
      isLoading: false,
    };
  }

  componentDidMount() {
    this.load();
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.scope === 'project' && projectChanged(prevProps.currentProject, this.props.currentProject)) {
      this.load();
    }
  }

  // project is the project whose configs the page lists: in project scope the
  // one picked in the top bar, else none, the global configs.
  project = () =>
    this.props.scope === 'project' && this.props.currentProject?.resolved ? this.props.currentProject.current : '';

  load = () => {
    if (this.props.scope === 'project' && !this.project()) {
      this.setState({ list: [], templates: [] });
      return;
    }
    this.listConfigs();
    listTemplates(this.project() || undefined).then((res) => {
      this.setState({ templates: (res && res.templates) || [] });
    });
  };

  listConfigs = () => {
    const project = this.project();
    this.setState({ isLoading: true });
    (project ? getProjectConfigs({ projectName: project }) : getConfigs())
      .then((res: any) => {
        this.setState({ list: (res && res.configs) || [] });
      })
      .finally(() => {
        this.setState({ isLoading: false });
      });
  };

  // setTemplate filters the list, keeping the filter in the URL so it can be linked to.
  setTemplate = (template: string) => {
    const path = this.props.scope === 'project' ? '/project-configs' : '/configs';
    this.setState({ template });
    this.props.dispatch(routerRedux.replace(template ? `${path}?template=${template}` : path));
  };

  onDelete = (record: Config) => {
    Dialog.confirm({
      content: 'Are you sure want to delete this config',
      onOk: () => {
        deleteConfig(record.name, this.project() || undefined).then((res) => {
          if (res) {
            Message.success(<Translation>Config deleted successfully</Translation>);
            this.listConfigs();
          }
        });
      },
      locale: locale().Dialog,
    });
  };

  onSuccess = () => {
    this.setState({ open: undefined });
    this.listConfigs();
  };

  templateOf = (name: string) => this.state.templates.find((t) => t.name === name);

  render() {
    const { list, templates, template, query, open, isLoading, distribution } = this.state;
    const inProject = this.props.scope === 'project';
    const project = this.project();
    const q = query.trim().toLowerCase();
    const shown = list.filter(
      (c) =>
        (!template || c.template?.name === template) &&
        (!q ||
          [c.name, c.alias, c.description, c.template?.name, c.templateAlias].some((v) =>
            (v || '').toLowerCase().includes(q)
          ))
    );
    const templateLabel = (t: ConfigTemplate) => (
      <span className="config-template">
        <img src={templateIcon(t.name)} />
        {t.alias || t.name}
      </span>
    );
    const columns = [
      {
        key: 'name',
        title: <Translation>Name</Translation>,
        dataIndex: 'name',
        cell: (v: string, i: number, config: Config) =>
          config.sensitive || (inProject && config.shared) ? (
            <span>{v}</span>
          ) : (
            <a
              onClick={() =>
                this.setState({
                  open: { name: v, template: config.template?.name, templateNamespace: config.template?.namespace },
                })
              }
            >
              {v}
            </a>
          ),
      },
      {
        key: 'alias',
        title: <Translation>Alias</Translation>,
        dataIndex: 'alias',
        cell: (v: string) => v || '',
      },
      ...(inProject
        ? [
            {
              key: 'where',
              title: <Translation>Where</Translation>,
              dataIndex: 'shared',
              cell: (v: boolean) => (
                <StatusBadge tone={v ? 'neutral' : 'progressing'} label={v ? 'Global' : 'Project'} />
              ),
            },
          ]
        : []),
      {
        key: 'template',
        title: <Translation>Template</Translation>,
        dataIndex: 'template',
        cell: (v: Config['template'], i: number, config: Config) => {
          const t = this.templateOf(v?.name);
          return (
            <span className="config-template">
              <img src={templateIcon(v?.name || '')} />
              {config.templateAlias || t?.alias || v?.name}
              {config.legacy && (
                <Tag size="small">
                  <Translation>Legacy</Translation>
                </Tag>
              )}
            </span>
          );
        },
      },
      {
        key: 'phase',
        title: <Translation>Status</Translation>,
        dataIndex: 'phase',
        cell: (v: string, i: number, config: Config) => {
          if (config.legacy) {
            return <span>-</span>;
          }
          const tone = v === 'Available' ? 'healthy' : v === 'Error' ? 'failed' : 'progressing';
          const tag = (
            <span>
              <StatusBadge tone={tone} label={v || 'Pending'} />
            </span>
          );
          return config.message ? <Balloon.Tooltip trigger={tag}>{config.message}</Balloon.Tooltip> : tag;
        },
      },
      {
        key: 'description',
        title: <Translation>Description</Translation>,
        dataIndex: 'description',
      },
      {
        key: 'createTime',
        title: <Translation>Create Time</Translation>,
        dataIndex: 'createdTime',
        cell: (v: string) => <span>{momentDate(v)}</span>,
      },
      {
        key: 'operation',
        title: <Translation>Actions</Translation>,
        dataIndex: 'operation',
        cell: (v: string, i: number, record: Config) =>
          inProject ? (
            // A shared config is the platform's: it is changed on the global page.
            !record.shared && (
              <Fragment>
                {record.legacy && (
                  <Permission
                    request={{ resource: `project:${project}/config:${record.name}`, action: 'distribute' }}
                    project={project}
                  >
                    <RowAction
                      icon={<AiOutlineSend />}
                      label="Distribute"
                      onClick={() => this.setState({ distribution: record })}
                    />
                  </Permission>
                )}
                <Permission
                  request={{ resource: `project:${project}/config:${record.name}`, action: 'delete' }}
                  project={project}
                >
                  <RowAction icon={<AiOutlineDelete />} label="Delete" danger onClick={() => this.onDelete(record)} />
                </Permission>
              </Fragment>
            )
          ) : (
            <Fragment>
              <Permission request={{ resource: `config:${record.name}`, action: 'delete' }} project={''}>
                <RowAction icon={<AiOutlineDelete />} label="Delete" danger onClick={() => this.onDelete(record)} />
              </Permission>
            </Fragment>
          ),
      },
    ];
    const { Column } = Table;
    return (
      <div className="list-content configs-list">
        <ListTitle
          title="Configs"
          subTitle={
            inProject
              ? "The project's configs, and the global ones shared with it"
              : 'Offering templated and extensible configuration management capabilities.'
          }
          extButtons={[
            <Permission
              key="new"
              request={{ resource: inProject ? `project:${project}/config:*` : `config:*`, action: 'create' }}
              project={inProject ? project : ''}
            >
              <Button type="primary" onClick={() => this.setState({ open: { template: template || undefined } })}>
                <Translation>New Config</Translation>
              </Button>
            </Permission>,
          ]}
        />
        {inProject && project === allProjects ? (
          <Empty
            message={<Translation>Pick a project in the top bar. Each project has configs of its own.</Translation>}
          />
        ) : (
          <>
            <div className="configs-toolbar">
              <Input
                className="configs-search"
                innerBefore={<AiOutlineSearch className="configs-search-icon" />}
                placeholder={i18n.t('Search by name, alias, template or description').toString()}
                value={query}
                onChange={(value: string) => this.setState({ query: value })}
                hasClear
              />
              <Select
                className="configs-template-filter"
                label={i18n.t('Template').toString()}
                placeholder={i18n.t('All').toString()}
                value={template || undefined}
                onChange={(value: string) => this.setTemplate(value || '')}
                hasClear
                locale={locale().Select}
                dataSource={templateFilterItems(
                  templateOptions(templates, list),
                  inProject ? { project: i18n.t('Project').toString(), global: i18n.t('Global').toString() } : undefined
                )}
                itemRender={(item: any) => templateLabel({ name: item.value, alias: item.label } as ConfigTemplate)}
              />
              <Button onClick={() => this.listConfigs()} title={i18n.t('Refresh').toString()}>
                <HiOutlineRefresh />
              </Button>
            </div>
            <Table locale={locale().Table} dataSource={shown} loading={isLoading}>
              {columns.map((col, key) => (
                <Column {...col} key={key} align={'left'} />
              ))}
            </Table>
          </>
        )}

        {open && (
          <CreateConfigDialog
            visible={true}
            project={project || undefined}
            configName={open.name}
            template={open.template ? { name: open.template, namespace: open.templateNamespace } : undefined}
            onSuccess={this.onSuccess}
            onClose={() => this.setState({ open: undefined })}
          />
        )}
        {distribution && (
          <DistributeConfigDialog
            config={distribution}
            targets={distribution.targets}
            projectName={project}
            onClose={() => this.setState({ distribution: undefined })}
            onSuccess={() => {
              this.setState({ distribution: undefined });
              this.listConfigs();
            }}
          />
        )}
      </div>
    );
  }
}

export default Configs;
