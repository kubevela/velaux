import React, { Component, Fragment } from 'react';
import { Button, Table } from '@b-design/ui';
import { Link } from 'dva/router';
import { getProjectTargetList } from '../../../../api/project';
import Translation from '../../../../components/Translation';
import locale from '../../../../utils/locale';
import Permission from '../../../../components/Permission';
import { getLanguage } from '../../../../utils/common';
import './index.less';

type Props = {
  projectName: string;
};

type State = {
  list: [];
  isLoading: boolean;
  isEditIntegration: boolean;
  editIntegrationItem: {};
};

class Targets extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      list: [],
      isLoading: false,
      isEditIntegration: false,
      editIntegrationItem: {},
    };
  }

  componentDidMount() {
    this.onTargets();
  }

  onTargets() {
    const { projectName } = this.props;
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
    const { list, isLoading } = this.state;
    const { projectName } = this.props;
    const language = getLanguage();
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
            <Table
              locale={locale[language as 'en' | 'zh'].Table}
              dataSource={list}
              hasBorder={true}
              loading={isLoading}
            >
              {columns && columns.map((col, key) => <Column {...col} key={key} align={'left'} />)}
            </Table>
          </section>
        </div>
      </Fragment>
    );
  }
}

export default Targets;
