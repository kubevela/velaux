import React, { Component, Fragment } from 'react';
import { connect } from 'dva';
import { Link } from 'dva/router';
import { Table, Button, Message } from '@b-design/ui';
import { getDefinitionsList, updateDefinitionStatus } from '../../api/definitions';
import type { DefinitionBase } from '../../interface/definitions';
import _ from 'lodash';
// import { momentDate } from '../../utils/common';
import Translation from '../../components/Translation';
import Permission from '../../components/Permission';
import SelectSearch from './components/SelectSearch';
import locale from '../../utils/locale';
import { getMatchParamObj } from '../../utils/utils';
import './index.less';

type Props = {
  match: {
    params: {
      definitionType: string;
    };
  };
};

type State = {
  definitionType: string;
  list: DefinitionBase[];
  isLoading: boolean;
  searchValue: string;
  searchList: DefinitionBase[];
};

@connect((store: any) => {
  return { ...store.definitions };
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
        },
      );
    }
  }

  lisDefinitions() {
    const { definitionType } = this.state;
    if (!definitionType) {
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

  showStatus = (record: DefinitionBase) => {
    if (record.status === 'enable') {
      return <Translation>Disable</Translation>;
    } else {
      return <Translation>Enable</Translation>;
    }
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
    const { definitionType, isLoading, searchValue } = this.state;
    const columns = [
      {
        key: 'name',
        title: <Translation>Name</Translation>,
        dataIndex: 'name',
        cell: (v: string) => {
          return <Link to={`/definitions/${definitionType}/${v}/ui-schema`}>{v}</Link>;
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
          const colorClass = (findStatus && findStatus.color) || '';
          return <span className={`${colorClass}`}>{findStatus && findStatus.status}</span>;
        },
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
                <Button
                  text
                  size={'medium'}
                  ghost={true}
                  component={'a'}
                  onClick={() => {
                    this.onChangeStatus(record);
                  }}
                >
                  {this.showStatus(record)}
                </Button>
              </Permission>
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
          hasBorder={false}
          loading={isLoading}
          fixedHeader={true}
          maxBodyHeight={'calc(100vh - 100px)'}
          className="margin-16"
        >
          {columns && columns.map((col, key) => <Column {...col} key={key} align={'left'} />)}
        </Table>
      </div>
    );
  }
}

export default Definitions;
