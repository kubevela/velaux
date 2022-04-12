import React, { Component, Fragment } from 'react';
import { Link } from 'dva/router';
import { Table, Button } from '@b-design/ui';
import { getProjectConfigs } from '../../../../api/project';
import { IntegrationConfigs } from '../../../../interface/integrations';
import Translation from '../../../../components/Translation';
import Permission from '../../../../components/Permission';
import _ from 'lodash';
import locale from '../../../../utils/locale';
import { momentDate } from '../../../../utils/common';
import './index.less';

type Props = {
  projectName: string;
};

type State = {
  configList: IntegrationConfigs[];
  isLoading: boolean;
};

class Integrations extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      configList: [],
      isLoading: false,
    };
  }

  componentDidMount() {
    this.listConfigs();
  }

  listConfigs = async () => {
    const { projectName = '' } = this.props;
    this.setState({
      isLoading: true,
    });
    getProjectConfigs({ projectName })
      .then((res) => {
        this.setState({
          configList: (Array.isArray(res) && res) || [],
        });
      })
      .finally(() => {
        this.setState({
          isLoading: false,
        });
      });
  };

  render() {
    const columns = [
      {
        key: 'name',
        title: <Translation>Name</Translation>,
        dataIndex: 'name',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'project',
        title: <Translation>Project</Translation>,
        dataIndex: 'project',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'configType',
        title: <Translation>Type</Translation>,
        dataIndex: 'configType',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'status',
        title: <Translation>Status</Translation>,
        dataIndex: 'status',
        cell: (v: string) => {
          const enumStatusList = [
            { name: 'Ready', color: 'isReadyColor' },
            { name: 'Not ready', color: 'isNotReady' },
          ];
          const findStatus = _.find(enumStatusList, (item) => {
            return item.name === v;
          });
          const colorClass = (findStatus && findStatus.color) || '';
          return <span className={`${colorClass}`}>{v}</span>;
        },
      },
      {
        key: 'createTime',
        title: <Translation>Create Time</Translation>,
        dataIndex: 'createdTime',
        cell: (v: string) => {
          return <span>{momentDate(v)}</span>;
        },
      },
    ];

    const { Column } = Table;
    const { configList, isLoading } = this.state;
    const { projectName } = this.props;
    return (
      <Fragment>
        <div className="integration-wrapper">
          <section className="card-title-wrapper">
            <span className="card-title">
              <Translation>Integrations</Translation>
            </span>
            <Permission
              request={{ resource: `configType:*`, action: 'create' }}
              project={projectName}
            >
              <Button className="card-button-wrapper">
                <Link to="/integrations" className="color-setting">
                  <Translation>Add</Translation>
                </Link>
              </Button>
            </Permission>
          </section>
          <section className="card-content-table">
            <Table
              locale={locale.Table}
              dataSource={configList}
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

export default Integrations;
