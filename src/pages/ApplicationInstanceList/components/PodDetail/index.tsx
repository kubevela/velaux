import React from 'react';
import { Table, Progress, Icon, Message } from '@b-design/ui';
import Translation from '../../../../components/Translation';
import type { PodBase, Container, Event } from '../../../../interface/observation';
import { listApplicationPodsDetails } from '../../../../api/observation';
import moment from 'moment';
import '../../index.less';
import { quantityToScalar } from '../../../../utils/utils';

export type Props = {
  pod: PodBase;
};

export type State = {
  containers?: Container[];
  events?: Event[];
  loading: boolean;
};
class PodDetail extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { loading: true };
  }

  componentDidMount() {
    this.loadPodDetail();
  }

  showStatus = (statu: string) => {
    const statsuInfo = [
      { name: 'running', value: <div style={{ color: 'green' }}>Running</div> },
      { name: 'terminated', value: <div style={{ color: 'red' }}>terminated</div> },
      { name: 'waiting', value: <div style={{ color: '#e17518' }}>waiting</div> },
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

  getContainerCloumns = () => {
    return [
      {
        key: 'name',
        title: <Translation>Container name</Translation>,
        dataIndex: 'name',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'status',
        title: <Translation>Running state</Translation>,
        dataIndex: 'status',
        cell: (v: string, i: number, record: Container) => {
          const { state = {} } = record.status || {};
          const key = (Object.keys(state) && Object.keys(state)[0]) || '';
          return this.showStatus(key);
        },
      },
      {
        key: 'image',
        title: <Translation>Mirror name</Translation>,
        dataIndex: 'image',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'memory',
        title: <Translation>Memory usageResource</Translation>,
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
        title: <Translation>CPU usageResource</Translation>,
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
        cell: () => {
          return (
            <div>
              <a>
                <Icon type="cloud-machine" />
              </a>

              <a className="margin-left-5">
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
        cell: (v: string, i: number, record: Event) => {
          return <span> {this.getTimes(record)}m</span>;
        },
      },
      {
        key: 'message',
        title: <Translation>Detaile information</Translation>,
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
        >
          {eventCloumns &&
            eventCloumns.map((col, key) => <Column {...col} key={key} align={'left'} />)}
        </Table>
      </div>
    );
  }
}

export default PodDetail;
