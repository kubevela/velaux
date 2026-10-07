import { Table, Message, Tag, Balloon } from '@alifd/next';
import i18n from 'i18next';
import { connect } from 'dva';
import { Link } from 'dva/router';
import _ from 'lodash';
import { AiOutlineCheckCircle, AiOutlinePieChart, AiOutlineStop } from 'react-icons/ai';
import React, { Component, Fragment } from 'react';
import { RowAction } from '../../components/RowAction';

import { getDefinitionsList, updateDefinitionStatus } from '../../api/definitions';
import Permission from '../../components/Permission';
import { RestrictionTags } from '../../components/RestrictionTags';
import { StatusBadge } from '../../components/StatusBadge';
import { Translation } from '../../components/Translation';
import type { DefinitionBase, DefinitionRestrictions, LoginUserInfo } from '@velaux/data';

// import { momentDate } from '../../utils/common';

import { locale } from '../../utils/locale';
import { getMatchParamObj } from '../../utils/utils';

import SelectSearch from './components/SelectSearch';
import { PolicyScopeTag } from '../../components/PolicyScopeTag';
import { UsageDialog } from './components/UsageDialog';

import './index.less';
import { checkPermission } from '../../utils/permission';

type Props = {
  match: {
    params: {
      definitionType: 'component' | 'trait' | 'workflowstep' | 'policy';
    };
  };
  userInfo?: LoginUserInfo;
};

type State = {
  definitionType: 'component' | 'trait' | 'workflowstep' | 'policy';
  list: DefinitionBase[];
  isLoading: boolean;
  searchValue: string;
  searchList: DefinitionBase[];
  // usageOf is the definition whose quota usage is shown.
  usageOf?: DefinitionBase;
};

@connect((store: any) => {
  return { ...store.definitions, ...store.user };
})
class Definitions extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      definitionType: this.getDefinitionType(),
      list: [],
      isLoading: false,
      searchValue: '',
      searchList: [],
    };
  }
  componentDidMount() {
    this.lisDefinitions();
  }

  componentWillReceiveProps(nextProps: Props) {
    const nextPropsParams = nextProps.match.params || {};
    if (nextPropsParams.definitionType !== this.state.definitionType) {
      this.setState(
        {
          definitionType: nextPropsParams.definitionType,
        },
        () => {
          this.lisDefinitions();
        }
      );
    }
  }

  lisDefinitions() {
    const { userInfo } = this.props;
    const { definitionType } = this.state;
    if (!definitionType) {
      return;
    }
    if (!checkPermission({ resource: 'definition:*', action: 'list' }, '', userInfo)) {
      return;
    }
    const params = {
      definitionType,
      queryAll: true,
    };
    this.setState({ isLoading: true });
    getDefinitionsList(params)
      .then((res) => {
        if (res) {
          this.setState({
            list: (res && res.definitions) || [],
            searchList: [],
            searchValue: '',
          });
        } else {
          this.setState({
            list: [],
            searchList: [],
            searchValue: '',
          });
        }
      })
      .finally(() => {
        this.setState({ isLoading: false });
      });
  }

  getDefinitionType = () => {
    return getMatchParamObj(this.props.match, 'definitionType');
  };

  onChangeStatus = (record: DefinitionBase) => {
    const { definitionType } = this.state;
    const { status, name } = record;
    if (status === 'enable') {
      updateDefinitionStatus({ name, hiddenInUI: true, type: definitionType })
        .then((res) => {
          if (res) {
            Message.success(<Translation>Update definition status success</Translation>);
            this.lisDefinitions();
          }
        })
        .catch();
    } else {
      updateDefinitionStatus({ name, hiddenInUI: false, type: definitionType })
        .then((res) => {
          if (res) {
            Message.success(<Translation>Update definition status success</Translation>);
            this.lisDefinitions();
          }
        })
        .catch();
    }
  };

  handleChangName = (value: string) => {
    const { list } = this.state;
    const newList: DefinitionBase[] = list.filter((item) => {
      return item.name && item.name.search(value) != -1;
    });
    this.setState({
      searchValue: value,
      searchList: newList,
    });
  };

  getDataSource = () => {
    const { list, searchValue, searchList = [] } = this.state;
    if (!searchValue && searchList.length === 0) {
      return list;
    } else {
      return searchList;
    }
  };

  render() {
    const { definitionType, isLoading, searchValue, usageOf } = this.state;
    const columns = [
      {
        key: 'name',
        title: <Translation>Name</Translation>,
        dataIndex: 'name',
        cell: (v: string, i: number, record: DefinitionBase) => {
          return (
            <span className="definition-name">
              <Link to={`/definitions/${definitionType}/${v}/ui-schema`}>{v}</Link>
              {record.abstract && (
                <Tag size="small" className="definition-abstract">
                  <Translation>Abstract</Translation>
                </Tag>
              )}
              {record.extends && (
                <span className="definition-extends">
                  <Translation>extends</Translation> {record.extends}
                </span>
              )}
              {record.policyScope && <PolicyScopeTag scope={record.policyScope} />}
              {record.policy?.global && (
                // A global policy applies to every Application in its namespace, in priority order.
                <Balloon.Tooltip
                  align="t"
                  trigger={
                    <Tag size="small" className="definition-tag-help">
                      <Translation>Global</Translation>
                    </Tag>
                  }
                >
                  {i18n.t('Applied to every Application in its namespace')} ({i18n.t('priority')}{' '}
                  {record.policy.priority || 0})
                </Balloon.Tooltip>
              )}
            </span>
          );
        },
      },
      {
        key: 'status',
        title: <Translation>Status</Translation>,
        dataIndex: 'status',
        cell: (v: string) => {
          const enumStatusList = [
            { name: 'enable', color: 'enableStatus', status: 'Enabled' },
            { name: 'disable', color: 'disableStatus', status: 'Disabled' },
          ];
          const findStatus = _.find(enumStatusList, (item) => {
            return item.name === v;
          });
          return findStatus ? (
            <StatusBadge tone={findStatus.name === 'enable' ? 'healthy' : 'neutral'} label={findStatus.status} />
          ) : null;
        },
      },
      {
        key: 'restrictions',
        title: <Translation>Restrictions</Translation>,
        dataIndex: 'restrictions',
        cell: (v?: DefinitionRestrictions) => <RestrictionTags restrictions={v} />,
      },
      // {
      //   key: 'createTime',
      //   title: <Translation>Create Time</Translation>,
      //   dataIndex: 'createdTime',
      //   cell: (v: string) => {
      //     return <span>{momentDate(v)}</span>;
      //   },
      // },
      {
        key: 'operation',
        title: <Translation>Actions</Translation>,
        dataIndex: 'operation',
        cell: (v: string, i: number, record: DefinitionBase) => {
          return (
            <Fragment>
              <Permission
                request={{
                  resource: `definition:${record.name}`,
                  action: 'update',
                }}
                project={''}
              >
                <RowAction
                  icon={record.status === 'enable' ? <AiOutlineStop /> : <AiOutlineCheckCircle />}
                  label={record.status === 'enable' ? 'Disable' : 'Enable'}
                  danger={record.status === 'enable'}
                  onClick={() => this.onChangeStatus(record)}
                />
              </Permission>
              {(definitionType === 'component' || definitionType === 'trait') &&
                (record.restrictions?.quota || []).length > 0 && (
                  <Permission request={{ resource: `definition:${record.name}`, action: 'detail' }} project={''}>
                    <RowAction
                      icon={<AiOutlinePieChart />}
                      label="Usage"
                      onClick={() => this.setState({ usageOf: record })}
                    />
                  </Permission>
                )}
            </Fragment>
          );
        },
      },
    ];

    const { Column } = Table;
    return (
      <div className="definitions-list-content">
        <SelectSearch
          searchValue={searchValue}
          handleChangName={(value: string) => {
            this.handleChangName(value);
          }}
        />
        <Table
          id="definitionTable"
          locale={locale().Table}
          dataSource={this.getDataSource()}
          loading={isLoading}
          fixedHeader={true}
          maxBodyHeight={'calc(100vh - 100px)'}
          className="margin-16"
        >
          {columns.map((col, key) => (
            <Column {...col} key={key} align={'left'} />
          ))}
        </Table>
        {usageOf && (definitionType === 'component' || definitionType === 'trait') && (
          <UsageDialog
            definition={usageOf}
            definitionType={definitionType}
            onClose={() => this.setState({ usageOf: undefined })}
          />
        )}
      </div>
    );
  }
}

export default Definitions;
