import { Grid, Checkbox, Dropdown, Menu, Loading, Button, Icon } from '@alifd/next';
import Ansi from 'ansi-to-react';
import React, { Component, Fragment } from 'react';

import { listContainerLog } from '../../../../api/observation';
import { Translation } from '../../../../components/Translation';
import type { ContainerLogResponse, PodBase } from '@velaux/data';
import { momentDate, momentShortDate } from '../../../../utils/common';
import { downloadStringFile } from '../../../../utils/utils';
import './index.less';
import { If } from '../../../../components/If';
import { FaEllipsisV } from 'react-icons/fa';

type Props = {
  pod?: PodBase;
  activeContainerName?: string;
};

type State = {
  autoRefresh: boolean;
  refreshInterval: number;
  logs: LogLine[];
  info?: { fromDate: string; toDate: string };
  showTimestamps: boolean;
  previous: boolean;
  loading: boolean;
};

interface LogLine {
  content: string;
  timestamp: string;
}

class ContainerLog extends Component<Props, State> {
  private readonly maxTailLine = 3000;
  timeoutID?: NodeJS.Timeout;
  constructor(props: Props) {
    super(props);
    this.state = {
      autoRefresh: true,
      refreshInterval: 5000,
      logs: [],
      showTimestamps: false,
      previous: false,
      loading: false,
    };
  }
  componentDidMount() {
    this.loadContainerLog();
  }

  componentWillReceiveProps(nextProps: any) {
    if (
      nextProps.pod?.metadata.name != this.props.pod?.metadata.name ||
      nextProps.activeContainerName != this.props.activeContainerName
    ) {
      if (this.timeoutID) {
        clearTimeout(this.timeoutID);
      }
      this.setState(
        {
          logs: [],
          loading: true,
        },
        () => {
          this.loadContainerLog();
        }
      );
    }
  }

  componentWillUnmount() {
    if (this.timeoutID) {
      clearTimeout(this.timeoutID);
    }
  }

  toLogLines = (logs: string) => {
    const logLines = logs.split('\n');
    const lines: LogLine[] = [];
    logLines.map((line) => {
      if (line) {
        const startsWithDate = 0 <= Number(line[0]) && Number(line[0]) <= 9; //2017-...
        const idx = line.indexOf(' ');
        if (idx > 0 && startsWithDate) {
          const timestamp = line.substring(0, idx);
          const content = line.substring(idx + 1);
          lines.push({ content: content, timestamp: timestamp });
        } else {
          lines.push({ content: line, timestamp: '' });
        }
      }
    });
    return lines;
  };

  loadContainerLog = () => {
    const { pod, activeContainerName = '' } = this.props;
    const { previous } = this.state;
    if (pod && activeContainerName) {
      listContainerLog({
        cluster: pod.cluster,
        namespace: pod.metadata.namespace,
        pod: pod.metadata.name,
        container: activeContainerName,
        previous: previous,
        timestamps: true,
        tailLines: this.maxTailLine,
      })
        .then((res: ContainerLogResponse) => {
          if (res && res.logs) {
            this.setState({ logs: this.toLogLines(res.logs), info: res.info });
          }
          if (res && res.err) {
            this.setState({ logs: this.toLogLines(res.err) });
          }
          const { autoRefresh, refreshInterval } = this.state;
          if (autoRefresh) {
            this.timeoutID = setTimeout(() => this.loadContainerLog(), refreshInterval);
          }
        })
        .catch(() => {})
        .finally(() => {
          this.setState({ loading: false });
        });
    } else {
      this.setState({ loading: false });
    }
  };

  setAutoRefresh = (v: boolean) => {
    this.setState({ autoRefresh: v });
    if (!v && this.timeoutID) {
      clearTimeout(this.timeoutID);
      this.timeoutID = undefined;
    }
    if (v && !this.timeoutID) {
      this.loadContainerLog();
    }
  };

  downloadLog = () => {
    const { pod, activeContainerName = '' } = this.props;
    const { logs } = this.state;

    let logContent: string[] = [];
    logs.map((line) => {
      logContent.push(line.content);
    });

    downloadStringFile(logContent.join('\n'), pod?.metadata.name + '-' + activeContainerName);
  };

  render() {
    const { Row, Col } = Grid;
    const { logs, info, showTimestamps, autoRefresh, refreshInterval, previous, loading } = this.state;
    return (
      <Fragment>
        <div className="application-logs-actions">
          <Button className="download" type="normal" size="small" onClick={this.downloadLog}>
            <Icon type="download" />
          </Button>
          <Checkbox checked={showTimestamps} onChange={(v) => this.setState({ showTimestamps: v })}>
            <Translation className="font-bold font-size-14">Show timestamps</Translation>
          </Checkbox>
          <Checkbox checked={autoRefresh} onChange={this.setAutoRefresh}>
            <Translation className="font-bold font-size-14">Auto-refresh</Translation>(every
            {refreshInterval / 1000} s.)
          </Checkbox>
          <Dropdown trigger={<FaEllipsisV />}>
            <Menu>
              <Menu.Item>
                <Checkbox checked={previous} onChange={(v) => this.setState({ previous: v })}>
                  <Translation className="font-bold font-size-14">Show previous logs</Translation>
                </Checkbox>
              </Menu.Item>
            </Menu>
          </Dropdown>
        </div>

        <Loading visible={loading} inline={false}>
          <div className="application-logs-wrapper margin-top-15">
            <div className="logBox">
              {logs.map((line) => {
                return (
                  <div className="logLine">
                    <span className="content">
                      <If condition={showTimestamps}>
                        {momentDate(line.timestamp)} | <Ansi>{line.content}</Ansi>
                      </If>
                      <If condition={!showTimestamps}>
                        <Ansi linkify={true}>{line.content}</Ansi>
                      </If>
                    </span>
                  </div>
                );
              })}
            </div>
            <Row style={{ width: '100%' }} className="margin-top-15">
              <Col span={12}>
                <span style={{ float: 'left', marginLeft: '16px' }}>
                  <Translation className="font-bold font-size-14">Logs Date</Translation>:
                  <span
                    style={{ marginLeft: '8px' }}
                    className="logDate font-bold font-size-14"
                    title={momentDate(info?.fromDate)}
                  >
                    {momentShortDate(info?.fromDate)}
                  </span>
                  ~
                  <span className="logDate font-bold font-size-14" title={momentDate(info?.toDate)}>
                    {momentShortDate(info?.toDate)}
                  </span>
                </span>
              </Col>
            </Row>
          </div>
        </Loading>
      </Fragment>
    );
  }
}

export default ContainerLog;
