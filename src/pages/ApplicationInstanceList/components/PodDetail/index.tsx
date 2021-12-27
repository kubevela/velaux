import React from 'react';
import { Table, Progress, Message, Icon } from '@b-design/ui';
import Translation from '../../../../components/Translation';
import type { PodBase, Container, Event } from '../../../../interface/observation';
import { listApplicationPodsDetails } from '../../../../api/observation';
import moment from 'moment';
import '../../index.less';
import { quantityToScalar } from '../../../../utils/utils';
import locale from '../../../../utils/locale';
import type { ApplicationDetail, EnvBinding } from '../../../../interface/application';
import { getAddonsStatus } from '../../../../api/addons';
import type { AddonClusterInfo, AddonStatus } from '../../../../interface/addon';

export type Props = {
  pod: PodBase;
  env?: EnvBinding;
  clusterName: string;
  application?: ApplicationDetail;
};

export type State = {
  containers?: Container[];
  events?: Event[];
  loading: boolean;
  observability?: any;
};
class PodDetail extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { loading: true };
  }

  componentDidMount() {
    this.loadPodDetail();
    this.loadAddonStatus();
  }

  showStatus = (statu: string) => {
    const statsuInfo = [
      { name: 'running', value: <div style={{ color: 'green' }}>Running</div> },
      { name: 'terminated', value: <div style={{ color: 'red' }}>Terminated</div> },
      { name: 'waiting', value: <div style={{ color: '#e17518' }}>Waiting</div> },
    ];
    const findStatus = statsuInfo.find((item) => item.name === statu) || { value: <div /> };
    return findStatus && findStatus.value;
  };

  getTimes = (record: Event) => {
    const { firstTimestamp, eventTime } = record;
    if (eventTime) {
      const date = (new Date().getTime() - moment(eventTime).valueOf()) / 60000;
      return date.toFixed(2);
    } else if (firstTimestamp) {
      const date = (new Date().getTime() - moment(firstTimestamp).valueOf()) / 60000;
      return date.toFixed(2);
    }
  };

  loadPodDetail = async () => {
    listApplicationPodsDetails({
      name: this.props.pod.metadata.name || '',
      namespace: this.props.pod.metadata.namespace || '',
      cluster: this.props.pod.cluster || '',
    })
      .then((re) => {
        if (re && re.error) {
          Message.warning(re.error);
        } else if (re) {
          this.setState({
            containers: re.containers,
            events: re.events,
          });
        }
      })
      .finally(() => {
        this.setState({ loading: false });
      });
  };

  loadAddonStatus = async () => {
    getAddonsStatus({ name: 'observability' }).then((re: AddonStatus) => {
      if (re && re.phase == 'enabled') {
        this.setState({ observability: re.clusters });
      }
    });
  };

  getContainerCloumns = () => {
    return [
      {
        key: 'name',
        title: <Translation>Container Name</Translation>,
        dataIndex: 'name',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'status',
        title: <Translation>Status</Translation>,
        dataIndex: 'status',
        cell: (v: string, i: number, record: Container) => {
          const { state = {} } = record.status || {};
          const key = (Object.keys(state) && Object.keys(state)[0]) || '';
          return this.showStatus(key);
        },
      },
      {
        key: 'image',
        title: <Translation>Image</Translation>,
        dataIndex: 'image',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'memory',
        title: <Translation>Memory</Translation>,
        dataIndex: 'memory',
        cell: (v: string, i: number, record: Container) => {
          if (record.resources?.requests?.memory && record.resources?.usage?.memory) {
            const requestMemory = quantityToScalar(record.resources?.requests?.memory);
            const useMemory = quantityToScalar(record.resources?.usage?.memory);
            const percent = Number(useMemory).valueOf() / Number(requestMemory).valueOf();
            return <Progress size="small" percent={percent * 100} />;
          }
          return <span>{record.resources?.usage?.memory}</span>;
        },
      },
      {
        key: 'cpu',
        title: <Translation>CPU</Translation>,
        dataIndex: 'cpu',
        cell: (v: string, i: number, record: Container) => {
          if (record.resources?.requests?.cpu && record.resources?.usage?.cpu) {
            const requestcpu = quantityToScalar(record.resources?.requests?.cpu);
            const usecpu = quantityToScalar(record.resources?.usage?.cpu);
            const percent = Number(usecpu).valueOf() / Number(requestcpu).valueOf();
            return <Progress size="small" percent={percent * 100} />;
          }
          return <span>{record.resources?.usage?.cpu}</span>;
        },
      },
      {
        key: 'operation',
        title: <Translation>Actions</Translation>,
        dataIndex: 'operation',
        cell: (v: string, i: number, record: Container) => {
          const { observability } = this.state;
          if (!observability) {
            return;
          }
          const { clusterName, env, pod, application } = this.props;
          let domain = '';
          Object.keys(observability).map((key) => {
            if (key == clusterName) {
              const clusterInfo: AddonClusterInfo = observability[key];
              if (clusterInfo.domain) {
                domain = clusterInfo.domain;
              } else if (clusterInfo.loadBalancerIP) {
                domain = 'http://' + clusterInfo.loadBalancerIP;
              }
              if (domain && !domain.startsWith('http')) {
                domain = 'http://' + domain;
              }
            }
          });
          if (!domain) {
            return;
          }
          const vars = `var-envName=${env?.name}&var-clusterName=${clusterName}&var-appName=${application?.name}&var-appAlias=${application?.alias}&var-podName=${pod.metadata.name}&var-podNamespace=${pod.metadata.namespace}&var-containerName=${record.name}`;
          const logURL = `${domain}/d/kubevela_application_logging/kubevela-application-logging-dashboard?orgId=1&refresh=10s&${vars}`;
          const monitorURL = `${domain}/d/kubevela_core_monitoring/kubevela-core-system-monitoring-dashboard?${vars}`;
          return (
            <div>
              <a title="Log" href={logURL} target="_blank" className="actionIcon">
                <Icon type="news" />
              </a>

              <a
                title="Grafana Dashboard"
                className="margin-left-5"
                href={monitorURL}
                target="_blank"
              >
                <Icon type="monitoring" />
              </a>
            </div>
          );
        },
      },
    ];
  };

  getEventCloumns = () => {
    return [
      {
        key: 'type',
        title: <Translation>Event Type</Translation>,
        dataIndex: 'type',
        width: 160,
        cell: (v: string, i: number, record: Event) => {
          const { type, reason } = record;
          return (
            <span>
              {type}/{reason}
            </span>
          );
        },
      },
      {
        key: 'time',
        title: <Translation>Time</Translation>,
        dataIndex: 'time',
        width: 100,
        cell: (v: string, i: number, record: Event) => {
          return <span> {this.getTimes(record)}m</span>;
        },
      },
      {
        key: 'message',
        title: <Translation>Message</Translation>,
        dataIndex: 'message',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
    ];
  };

  render() {
    const { Column } = Table;
    const containerColumns = this.getContainerCloumns();
    const eventCloumns = this.getEventCloumns();
    const { events, containers, loading } = this.state;
    return (
      <div className="table-podDetails-list  margin-top-20">
        <Table
          className="container-table-wraper margin-top-20"
          dataSource={containers}
          hasBorder={false}
          primaryKey="name"
          loading={loading}
          locale={locale.Table}
        >
          {containerColumns &&
            containerColumns.map((col, key) => <Column {...col} key={key} align={'left'} />)}
        </Table>

        <Table
          className="event-table-wraper margin-top-20"
          dataSource={events}
          hasBorder={false}
          loading={loading}
          primaryKey="time"
          locale={locale.Table}
        >
          {eventCloumns &&
            eventCloumns.map((col, key) => <Column {...col} key={key} align={'left'} />)}
        </Table>
      </div>
    );
  }
}

export default PodDetail;
