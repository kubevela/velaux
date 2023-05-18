import React from 'react';
import { Table, Progress, Message, Dialog, Button } from '@alifd/next';

import '../../index.less';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import moment from 'moment';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { AiOutlineCode, AiOutlineCopy } from 'react-icons/ai';

import { listApplicationPodsDetails } from '../../../../api/observation';
import { If } from '../../../../components/If';
import { Translation } from '../../../../components/Translation';
import i18n from '../../../../i18n';
import type { AddonBaseStatus , ApplicationDetail, EnvBinding , PodBase, Container, Event , LoginUserInfo } from '@velaux/data';
import { checkEnabledAddon } from '../../../../utils/common';
import { locale } from '../../../../utils/locale';
import { quantityToScalar } from '../../../../utils/utils';
import ContainerLog from '../ContainerLog';
import { HiOutlineNewspaper } from 'react-icons/hi';

export type Props = {
  pod: PodBase;
  env?: EnvBinding;
  clusterName: string;
  application?: ApplicationDetail;
  userInfo?: LoginUserInfo;
  enabledAddons?: AddonBaseStatus[];
  dispatch?: ({}) => void;
};

export type State = {
  containers?: Container[];
  events?: Event[];
  loading: boolean;
  showContainerLog: boolean;
  containerName: string;
};

@connect((store: any) => {
  return { ...store.cloudshell, ...store.addons };
})
class PodDetail extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { loading: true, showContainerLog: false, containerName: '' };
  }

  componentDidMount() {
    this.loadPodDetail();
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
    return;
  };

  onOpenCloudShell = (containerName: string) => {
    const { env, pod } = this.props;
    if (!checkEnabledAddon('cloudshell', this.props.enabledAddons)) {
      Dialog.alert({
        title: i18n.t('CloudShell feature is not enabled').toString(),
        content: i18n.t('You must enable the CloudShell addon first').toString(),
        locale: locale().Dialog,
        footer: (
          <Button
            type="secondary"
            onClick={() => {
              if (this.props.dispatch) {
                this.props.dispatch(
                  routerRedux.push({
                    pathname: '/addons/cloudshell',
                  })
                );
              }
            }}
          >
            <Translation>Go to enable</Translation>
          </Button>
        ),
      });
      return;
    }
    const shellScript = `vela exec ${env?.appDeployName} -n ${env?.appDeployNamespace} --component ${pod.component} --cluster ${pod.cluster} --pod ${pod.metadata.name} --container ${containerName} -- bash`;
    Dialog.show({
      footer: false,
      style: { width: 600 },
      content: (
        <div>
          <h5>
            1. <Translation>Copy the command</Translation>:
          </h5>
          <code className="code">
            {shellScript}{' '}
            <CopyToClipboard
              onCopy={() => {
                Message.success('Copied successfully');
              }}
              text={shellScript}
            >
              <AiOutlineCopy size={14} />
            </CopyToClipboard>
          </code>
          <h5>
            2. <Translation>Open Cloud Shell</Translation>:
          </h5>
          <div>
            <Button
              size="small"
              type="secondary"
              onClick={() => {
                if (this.props.dispatch) {
                  this.props.dispatch({
                    type: 'cloudshell/open',
                  });
                }
              }}
            >
              <Translation>Open Cloud Shell</Translation>
            </Button>
          </div>
        </div>
      ),
    });
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

  showContainerLog = (containerName: string) => {
    this.setState({ showContainerLog: true, containerName: containerName });
  };

  getContainerColumns = () => {
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
          if (record.resources?.usage?.memory) {
            return <span>{record.resources?.usage?.memory}</span>;
          }
          if (record.resources?.requests?.memory) {
            return (
              <span>
                <Translation>Request</Translation>: {record.resources?.requests?.memory}
              </span>
            );
          }
          return <span />;
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
          if (record.resources?.usage?.cpu) {
            return <span>{record.resources?.usage?.cpu}</span>;
          }
          if (record.resources?.requests?.cpu) {
            return (
              <span>
                <Translation>Request</Translation>: {record.resources?.requests?.cpu}
              </span>
            );
          }
          return <span />;
        },
      },
      {
        key: 'restarts',
        title: <Translation>Restarts</Translation>,
        dataIndex: 'restarts',
        cell: (v: string, i: number, record: Container) => {
          if (record.status?.restartCount !== undefined) {
            return <span>{record.status?.restartCount}</span>;
          }
          return <span />;
        },
      },
      {
        key: 'operation',
        title: <Translation>Actions</Translation>,
        dataIndex: 'operation',
        cell: (v: string, i: number, record: Container) => {
          return (
            <div className="operations">
              <a title="Log" onClick={() => this.showContainerLog(record.name)} className="actionIcon">
                <HiOutlineNewspaper />
              </a>
              <a title="Console Shell" onClick={() => this.onOpenCloudShell(record.name)} className="actionIcon">
                <AiOutlineCode size={20} />
              </a>
            </div>
          );
        },
      },
    ];
  };

  getEventColumns = () => {
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
    const containerColumns = this.getContainerColumns();
    const eventColumns = this.getEventColumns();
    const { events, containers, loading, showContainerLog, containerName } = this.state;
    const { pod, clusterName } = this.props;
    return (
      <div className="table-podDetails-list  margin-top-20">
        <Table
          className="container-table-wrapper margin-top-20"
          dataSource={containers || []}
          primaryKey="name"
          loading={loading}
          locale={locale().Table}
        >
          {containerColumns && containerColumns.map((col, key) => <Column {...col} key={key} align={'left'} />)}
        </Table>

        <Table
          className="event-table-wrapper margin-top-20"
          dataSource={events || []}
          loading={loading}
          primaryKey="time"
          locale={locale().Table}
        >
          {eventColumns && eventColumns.map((col, key) => <Column {...col} key={key} align={'left'} />)}
        </Table>

        <If condition={showContainerLog}>
          <ContainerLog
            onClose={() => {
              this.setState({ showContainerLog: false, containerName: '' });
            }}
            pod={pod}
            containerName={containerName}
            clusterName={clusterName}
          />
        </If>
      </div>
    );
  }
}

export default PodDetail;
