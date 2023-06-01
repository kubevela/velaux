import { Message, Grid, Select } from '@alifd/next';
import { connect } from 'dva';
import querystring from 'query-string';
import React, { Fragment } from 'react';

import { listApplicationPods, listApplicationPodsDetails } from '../../api/observation';
import { Translation } from '../../components/Translation';
import i18n from '../../i18n';
import type {
  ApplicationComponent,
  ApplicationDetail,
  ApplicationStatus,
  EnvBinding,
 PodBase, Container } from '@velaux/data';

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
  components?: ApplicationComponent[];
  dispatch: ({}) => void;
};

type State = {
  appName: string;
  podList?: PodBase[];
  pod?: PodBase;
  envName: string;
  containers?: Container[];
  activePodName: string;
  activeComponentName: string;
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
      activeComponentName: '',
      activePodName: '',
      activeContainerName: '',
      isActiveContainerNameDisabled: true,
    };
  }

  componentDidMount() {
    this.loadApplicationStatus();
  }

  componentWillReceiveProps(nextProps: Props) {
    const { params } = nextProps.match;
    if (params.envName !== this.state.envName || this.props.envbinding != nextProps.envbinding) {
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
    const { envbinding } = this.props;
    const { appName, envName, activeComponentName } = this.state;
    const envs = envbinding.filter((item) => item.name === envName);
    if (envs.length > 0 && envs[0]) {
      const param = {
        appName: envs[0].appDeployName || appName,
        appNs: envs[0].appDeployNamespace,
        componentName: activeComponentName,
        cluster: '',
        clusterNs: '',
      };
      listApplicationPods(param)
        .then((res) => {
          if (res && res.podList && res.podList.length > 0) {
            this.setState(
              {
                podList: res.podList,
                activePodName: '',
              },
              () => {
                const query = querystring.parse(location.search);
                if (query && query.pod) {
                  this.handlePodNameChange(query.pod);
                } else {
                  this.handlePodNameChange(res.podList[0].metadata.name);
                }
              }
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
            this.setState(
              {
                containers: res.containers,
              },
              () => {
                this.handleContainerNameChange(activeContainerName);
              }
            );
          }
        })
        .catch(() => {});
    }
  };
  handleComponentNameChange = (value: string) => {
    this.setState({ activeComponentName: value, activePodName: '', activeContainerName: '' }, () => {
      this.loadPodInstance();
    });
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
      }
    );
  };

  handleContainerNameChange = (value: string) => {
    this.setState({ activeContainerName: value });
  };

  getComponentNameList = () => {
    const { components } = this.props;
    return components?.map((c) => {
      return { label: c.alias || c.name, value: c.name };
    });
  };

  getPodNameList = () => {
    const { podList, activeComponentName } = this.state;
    if (podList && podList.length != 0) {
      const podNameList: string[] = [];
      podList.forEach((item) => {
        if (item.metadata && item.metadata.name) {
          if (!activeComponentName || item.component == activeComponentName) {
            podNameList.push(item.metadata.name);
          }
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
    const { pod, activePodName, activeContainerName, activeComponentName, isActiveContainerNameDisabled } = this.state;
    const podLabel = (
      <span>
        <Translation>Pod</Translation>:
      </span>
    );
    const containerLabel = (
      <span>
        <Translation>Container</Translation>:
      </span>
    );

    return (
      <Fragment>
        <Row>
          <Col span="4">
            <Select
              placeholder={i18n.t('Select Component').toString()}
              label={i18n.t('Component').toString()}
              dataSource={this.getComponentNameList()}
              value={activeComponentName}
              onChange={this.handleComponentNameChange}
            />
          </Col>
          <Col span="4" className="margin-left-10">
            <Select
              placeholder={i18n.t('Select Pod').toString()}
              label={podLabel}
              dataSource={this.getPodNameList()}
              value={activePodName}
              onChange={this.handlePodNameChange}
            />
          </Col>
          <Col span="4" className="margin-left-10">
            <Select
              placeholder={i18n.t('Select Container').toString()}
              label={containerLabel}
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
