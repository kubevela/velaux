import { Table, Button, Dialog, Message, Tag, Balloon, Input, Select } from '@alifd/next';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import React, { Component, Fragment } from 'react';
import { AiOutlineDelete, AiOutlineSearch } from 'react-icons/ai';
import { HiOutlineRefresh } from 'react-icons/hi';

import { getConfigs, deleteConfig, listTemplates } from '../../api/config';
import { ListTitle } from '../../components/ListTitle';
import Permission from '../../components/Permission';
import { RowAction } from '../../components/RowAction';
import { StatusBadge } from '../../components/StatusBadge';
import { Translation } from '../../components/Translation';
import i18n from '../../i18n';
import type { ConfigTemplate, Config, LoginUserInfo } from '@velaux/data';
import { momentDate } from '../../utils/common';
import { locale } from '../../utils/locale';
import CreateConfigDialog from './components/CreateConfigDialog';
import { templateIcon } from './icons';
import './index.less';

type Props = {
  userInfo?: LoginUserInfo;
  location?: { search?: string };
  dispatch: ({}) => {};
};

type State = {
  list: Config[];
  templates: ConfigTemplate[];
  // template filters the list to one template's configs; empty is all.
  template: string;
  query: string;
  // open is the config the dialog shows, or new for a config not yet made.
  open?: { name?: string; template?: string; templateNamespace?: string };
  isLoading: boolean;
};

// templateParam is the template a link to the list filters it to.
function templateParam(search?: string): string {
  return new URLSearchParams(search || '').get('template') || '';
}

@connect((store: any) => {
  return { ...store.user };
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
    this.listConfigs();
    listTemplates().then((res) => {
      this.setState({ templates: (res && res.templates) || [] });
    });
  }

  listConfigs = () => {
    this.setState({ isLoading: true });
    getConfigs()
      .then((res) => {
        this.setState({ list: (res && res.configs) || [] });
      })
      .finally(() => {
        this.setState({ isLoading: false });
      });
  };

  // setTemplate filters the list, keeping the filter in the URL so it can be linked to.
  setTemplate = (template: string) => {
    this.setState({ template });
    this.props.dispatch(routerRedux.replace(template ? `/configs?template=${template}` : '/configs'));
  };

  onDelete = (record: Config) => {
    Dialog.confirm({
      content: 'Are you sure want to delete this config',
      onOk: () => {
        deleteConfig(record.name).then((res) => {
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
    const { list, templates, template, query, open, isLoading } = this.state;
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
          config.sensitive ? (
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
        cell: (v: string, i: number, record: Config) => (
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
          subTitle="Offering templated and extensible configuration management capabilities."
          extButtons={[
            <Permission key="new" request={{ resource: `config:*`, action: 'create' }} project={''}>
              <Button type="primary" onClick={() => this.setState({ open: { template: template || undefined } })}>
                <Translation>New Config</Translation>
              </Button>
            </Permission>,
          ]}
        />
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
            dataSource={templates.map((t) => ({ label: t.alias || t.name, value: t.name }))}
            itemRender={(item: any) => {
              const t = this.templateOf(item.value);
              return t ? templateLabel(t) : item.label;
            }}
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

        {open && (
          <CreateConfigDialog
            visible={true}
            configName={open.name}
            template={open.template ? { name: open.template, namespace: open.templateNamespace } : undefined}
            onSuccess={this.onSuccess}
            onClose={() => this.setState({ open: undefined })}
          />
        )}
      </div>
    );
  }
}

export default Configs;
