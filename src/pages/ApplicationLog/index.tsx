import React, { Fragment } from 'react';
import { connect } from 'dva';
import { Message, Grid, Select } from '@b-design/ui';
import { listApplicationPods, listApplicationPodsDetails } from '../../api/observation';
import type { ApplicationDetail, ApplicationStatus, EnvBinding } from '../../interface/application';
import type { PodBase, Container } from '../../interface/observation';
import LogContainer from './components/LogContainer';

type Props = {
  match: {
    params: {
      envName: string;
      appName: string;
    };
  };
  applicationDetail?: ApplicationDetail;
  applicationStatus?: ApplicationStatus;
  envbinding: EnvBinding[];
  dispatch: ({}) => void;
};

type State = {
  appName: string;
  podList?: PodBase[];
  pod?: PodBase;
  envName: string;
  containers?: Container[];
  activePodName: string;
  activeContainerName: string;
  isActiveContainerNameDisabled: boolean;
};

@connect((store: any) => {
  return { ...store.application };
})
class ApplicationLog extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const { params } = props.match;
    this.state = {
      appName: params.appName,
      envName: params.envName,
      podList: [],
      activePodName: '',
      activeContainerName: '',
      isActiveContainerNameDisabled: true,
    };
  }

  componentDidMount() {
    this.loadApplicationStatus();
  }

  componentWillReceiveProps(nextProps: any) {
    const { params } = nextProps.match;
    if (params.envName !== this.state.envName) {
      this.setState({ envName: params.envName }, () => {
        this.loadApplicationStatus();
      });
    }
  }

  loadApplicationStatus = async () => {
    const { appName, envName } = this.state;
    if (envName) {
      this.props.dispatch({
        type: 'application/getApplicationStatus',
        payload: { appName, envName },
        callback: () => {
          this.loadPodInstance();
        },
      });
    }
  };

  loadPodInstance = async () => {
    const { applicationDetail, envbinding, applicationStatus } = this.props;
    const { appName, envName } = this.state;
    const envs = envbinding.filter((item) => item.name === envName);
    if (applicationDetail?.name && applicationStatus?.services?.length && envs.length > 0) {
      const componentName = applicationStatus.services[0].name;
      const param = {
        appName: envs[0].appDeployName || appName,
        appNs: envs[0].appDeployNamespace,
        name: componentName,
        cluster: '',
        clusterNs: '',
      };
      listApplicationPods(param)
        .then((res) => {
          if (res && res.podList) {
            this.setState(
              {
                podList: res.podList,
                pod: res.podList[0] || {},
                activePodName: res.podList[0]?.metadata.name,
              },
              () => {
                this.loadPodDetail();
              },
            );
          } else {
            this.setState({
              podList: [],
            });
          }
        })
        .catch(() => {});
    }
  };

  loadPodDetail = async () => {
    const { pod } = this.state;
    if (pod) {
      listApplicationPodsDetails({
        name: pod?.metadata.name || '',
        namespace: pod?.metadata.namespace || '',
        cluster: pod?.cluster || '',
      })
        .then((res) => {
          if (res && res.error) {
            Message.warning(res.error);
          } else if (res) {
            const activeContainerName = (res.containers?.[0] && res.containers[0]?.name) || '';
            this.setState({
              containers: res.containers,
              activeContainerName,
              isActiveContainerNameDisabled: activeContainerName ? false : true,
            });
          }
        })
        .catch(() => {});
    }
  };

  handlePodNameChange = (value: any) => {
    const { podList } = this.state;
    const findPod: PodBase[] = (podList || []).filter((item) => item.metadata.name === value);
    this.setState(
      {
        activePodName: value,
        activeContainerName: '',
        pod: findPod[0] || {},
        isActiveContainerNameDisabled: false,
      },
      () => {
        this.loadPodDetail();
      },
    );
  };

  handleContainerNameChange = (value: string) => {
    this.setState({ activeContainerName: value });
  };

  getPodNameList = () => {
    const { podList } = this.state;
    if (podList && podList.length != 0) {
      const podNameList: string[] = [];
      podList.forEach((item) => {
        if (item.metadata && item.metadata.name) {
          podNameList.push(item.metadata.name);
        }
      });
      return podNameList;
    } else {
      return [];
    }
  };

  getContainerNameList = () => {
    const { containers } = this.state;
    if (containers && containers.length != 0) {
      const containersNameList: string[] = [];
      containers.forEach((item) => {
        if (item) {
          containersNameList.push(item.name);
        }
      });
      return containersNameList;
    } else {
      return [];
    }
  };

  render() {
    const { Row, Col } = Grid;
    const { pod, activePodName, activeContainerName, isActiveContainerNameDisabled } = this.state;
    return (
      <Fragment>
        <Row>
          <Col span="6">
            <Select
              placeholder="Select Pod"
              dataSource={this.getPodNameList()}
              value={activePodName}
              onChange={this.handlePodNameChange}
            />
          </Col>
          <Col span="6" className="margin-left-10">
            <Select
              placeholder="Select PodDetailsName"
              dataSource={this.getContainerNameList()}
              value={activeContainerName}
              onChange={this.handleContainerNameChange}
              disabled={isActiveContainerNameDisabled}
            />
          </Col>
        </Row>

        <LogContainer pod={pod} activeContainerName={activeContainerName} />
      </Fragment>
    );
  }
}

export default ApplicationLog;
