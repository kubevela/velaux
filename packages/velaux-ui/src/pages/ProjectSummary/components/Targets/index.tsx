import { Button, Table } from '@alifd/next';
import { Link } from 'dva/router';
import React, { Component, Fragment } from 'react';

import { getProjectTargetList } from '../../../../api/project';
import Permission from '../../../../components/Permission';
import { Translation } from '../../../../components/Translation';
import { locale } from '../../../../utils/locale';
import './index.less';

type Props = {
  projectName: string;
};

type State = {
  list: [];
  isLoading: boolean;
  isEditConfig: boolean;
};

class Targets extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      list: [],
      isLoading: false,
      isEditConfig: false,
    };
  }

  componentDidMount() {
    const { projectName } = this.props;
    this.loadTargets(projectName);
  }

  shouldComponentUpdate(nextProps: Props) {
    const change = nextProps.projectName !== this.props.projectName;
    if (change) {
      this.loadTargets(nextProps.projectName);
    }
    return true;
  }

  loadTargets(projectName: string) {
    this.setState({
      isLoading: true,
    });
    getProjectTargetList({ projectName })
      .then((res) => {
        this.setState({
          list: (res && res.targets) || [],
        });
      })
      .finally(() => {
        this.setState({
          isLoading: false,
        });
      });
  }

  render() {
    const columns = [
      {
        key: 'name',
        title: <Translation>Name(Alias)</Translation>,
        dataIndex: 'name',
        cell: (v: string, i: number, record: { alias: string; name: string }) => {
          const { alias, name } = record;
          return <span>{`${name}(${alias || '-'})`}</span>;
        },
      },
      {
        key: 'cluster',
        title: <Translation>Cluster/Namespace</Translation>,
        dataIndex: 'cluster',
        cell: (v: string, i: number, record: { cluster: { clusterName: string; namespace: string } }) => {
          const { cluster = { clusterName: '', namespace: '' } } = record;
          return <span>{`${cluster.clusterName}/${cluster.namespace}`}</span>;
        },
      },
      {
        key: 'description',
        title: <Translation>Description</Translation>,
        dataIndex: 'description',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
    ];

    const { Column } = Table;
    const { list, isLoading } = this.state;
    const { projectName } = this.props;
    return (
      <Fragment>
        <div className="summary-targets-wrapper">
          <section className="card-title-wrapper">
            <span className="card-title">
              <Translation>Targets</Translation>
            </span>
            <Permission request={{ resource: `target:*`, action: 'create' }} project={projectName}>
              <Button className="card-button-wrapper">
                <Link to="/targets" className="color-setting">
                  <Translation>Add</Translation>
                </Link>
              </Button>
            </Permission>
          </section>
          <section className="card-content-table">
            <Table locale={locale().Table} dataSource={list} hasBorder={true} loading={isLoading}>
              {columns.map((col, key) => (
                <Column {...col} key={key} align={'left'} />
              ))}
            </Table>
          </section>
        </div>
      </Fragment>
    );
  }
}

export default Targets;
