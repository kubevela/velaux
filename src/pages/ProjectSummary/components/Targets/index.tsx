import React, { Component, Fragment } from 'react';
import { Button, Table } from '@b-design/ui';
import { Link } from 'dva/router';
import { getProjectTargetList } from '../../../../api/project';
import Translation from '../../../../components/Translation';
import locale from '../../../../utils/locale';
import './index.less';

type Props = {
  projectName: string;
};

type State = {
  list: [];
  visible: boolean;
  isEditIntegration: boolean;
  editIntegrationItem: {};
};

class Targets extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      list: [],
      visible: false,
      isEditIntegration: false,
      editIntegrationItem: {},
    };
  }

  componentDidMount() {
    this.onTargets();
  }

  onTargets() {
    const { projectName } = this.props;
    getProjectTargetList({ projectName }).then((res) => {
      this.setState({
        list: (res && res.targets) || [],
      });
    });
  }

  render() {
    const columns = [
      {
        key: 'name',
        title: <Translation>Alias(Name)</Translation>,
        dataIndex: 'name',
        cell: (v: string, i: number, record: { alias: string; name: string }) => {
          const { alias, name } = record;
          return <span>{`${alias}(${name})`}</span>;
        },
      },
      {
        key: 'cluster',
        title: <Translation>Cluster/Namespace</Translation>,
        dataIndex: 'cluster',
        cell: (
          v: string,
          i: number,
          record: { cluster: { clusterName: string; namespace: string } },
        ) => {
          const { cluster = { clusterName: '', namespace: '' } } = record;
          return <span>{`${cluster.clusterName}(${cluster.namespace})`}</span>;
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
    const { list } = this.state;
    return (
      <Fragment>
        <div className="summary-targets-wrapper">
          <section className="card-title-wrapper">
            <span className="card-title">
              <Translation>Targets</Translation>
            </span>
            <Button className="card-button-wrapper">
              <Link to="/targets" className="color-setting">
                <Translation>Add</Translation>
              </Link>
            </Button>
          </section>
          <section className="card-content-table">
            <Table locale={locale.Table} dataSource={list} hasBorder={true} loading={false}>
              {columns && columns.map((col, key) => <Column {...col} key={key} align={'left'} />)}
            </Table>
          </section>
        </div>
      </Fragment>
    );
  }
}

export default Targets;
