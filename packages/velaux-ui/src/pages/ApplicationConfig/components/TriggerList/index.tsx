import { Dialog, Grid, Message, Tab } from '@alifd/next';
import React, { Component } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import { getApplicationComponent } from '../../../../api/application';
import Empty from '../../../../components/Empty';
import { If } from '../../../../components/If';
import Item from '../../../../components/Item';
import Permission from '../../../../components/Permission';
import '../../../../components/RowList';
import { RowAction } from '../../../../components/RowAction';
import { Translation } from '../../../../components/Translation';
import type { ApplicationComponentBase, ApplicationComponent, Trigger, ApplicationDetail } from '@velaux/data';
import { beautifyTime, momentDate, showAlias } from '../../../../utils/common';
import './index.less';
import { locale } from '../../../../utils/locale';
import {
  AiOutlineApi,
  AiOutlineDelete,
  AiOutlineDown,
  AiOutlineEdit,
  AiOutlinePlayCircle,
  AiOutlineRight,
} from 'react-icons/ai';

type Props = {
  appName: string;
  triggers: Trigger[];
  createTriggerInfo?: Trigger;
  components: ApplicationComponentBase[];
  applicationDetail?: ApplicationDetail;
  onDeleteTrigger: (token: string) => void;
  onEditTrigger: (t: Trigger) => void;
};

type State = {
  showTrigger?: Trigger;
  component?: ApplicationComponent;
  customTriggerType?: string;
  // open holds the triggers whose rows are expanded.
  open: Record<string, boolean>;
};

class TriggerList extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { open: {} };
  }

  toggle = (name: string) => {
    this.setState({ open: { ...this.state.open, [name]: !this.state.open[name] } });
  };

  componentWillReceiveProps(nextProps: Props) {
    const { createTriggerInfo } = nextProps;
    if (createTriggerInfo && createTriggerInfo !== this.props.createTriggerInfo) {
      this.showWebhook(createTriggerInfo);
    }
  }
  showWebhook = (trigger: Trigger) => {
    const { components } = this.props;
    this.loadComponentDetail(trigger.componentName || (components.length > 0 ? components[0].name : ''));
    this.setState({ showTrigger: trigger });
    this.setState({ customTriggerType: 'execute' });
  };

  loadComponentDetail = (componentName: string) => {
    if (!componentName) {
      return;
    }
    const { appName } = this.props;
    getApplicationComponent(appName, componentName).then((res: ApplicationComponent) => {
      if (res) {
        this.setState({
          component: res,
        });
      }
    });
  };
  closeWebhook = () => {
    this.setState({ showTrigger: undefined });
  };

  handleTriggerDelete = (token: string) => {
    Dialog.alert({
      content: 'Are you sure want to delete this trigger?',
      onOk: () => {
        this.props.onDeleteTrigger(token || '');
      },
      onClose: () => {},
      locale: locale().Dialog,
    });
  };

  handleCustomTriggerTab = (token: string) => {
    this.setState({ customTriggerType: token });
  };

  render() {
    const { Row, Col } = Grid;
    const { triggers, applicationDetail } = this.props;

    const { showTrigger, component, customTriggerType, open } = this.state;

    const domain = `${window.location.protocol}//${window.location.host}`;
    const webHookURL = `${domain}/api/v1/webhook/${showTrigger?.token}`;
    let command = `curl -X POST -H 'content-type: application/json' --url ${webHookURL}`;

    if (showTrigger?.payloadType == 'custom' && component) {
      const customTriggerBody: { [x: string]: Object } = {
        execute: {
          action: 'execute',
          upgrade: {
            [component.name]: {
              image: component.properties && component.properties.image,
            },
          },
          codeInfo: {
            commit: '',
            branch: '',
            user: '',
          },
        },
        approve: {
          action: 'approve',
          step: 'suspend',
        },
        terminate: {
          action: 'terminate',
          step: 'suspend',
        },
        rollback: {
          action: 'rollback',
          step: 'suspend',
        },
      };
      let body = customTriggerType ? customTriggerBody[customTriggerType] : ' ';
      command = `curl -X POST -H 'content-type: application/json' --url ${webHookURL} -d '${JSON.stringify(body)}'`;
    }

    const copy = (
      <span style={{ lineHeight: '16px', marginLeft: '8px' }}>
        <svg
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="1982"
          width="16"
          height="16"
        >
          <path
            d="M720 192h-544A80.096 80.096 0 0 0 96 272v608C96 924.128 131.904 960 176 960h544c44.128 0 80-35.872 80-80v-608C800 227.904 764.128 192 720 192z m16 688c0 8.8-7.2 16-16 16h-544a16 16 0 0 1-16-16v-608a16 16 0 0 1 16-16h544a16 16 0 0 1 16 16v608z"
            p-id="1983"
          />
          <path
            d="M848 64h-544a32 32 0 0 0 0 64h544a16 16 0 0 1 16 16v608a32 32 0 1 0 64 0v-608C928 99.904 892.128 64 848 64z"
            p-id="1984"
          />
          <path
            d="M608 360H288a32 32 0 0 0 0 64h320a32 32 0 1 0 0-64zM608 520H288a32 32 0 1 0 0 64h320a32 32 0 1 0 0-64zM480 678.656H288a32 32 0 1 0 0 64h192a32 32 0 1 0 0-64z"
            p-id="1985"
          />
        </svg>
      </span>
    );
    const customTriggerTypes = ['execute', 'approve', 'terminate', 'rollback'];
    const projectName = applicationDetail && applicationDetail.project?.name;
    return (
      <div>
        <If condition={!triggers || triggers.length == 0}>
          <Empty message={<Translation>There are no triggers</Translation>} />
        </If>
        <If condition={triggers && triggers.length > 0}>
          <div className="row-list trigger-list">
            <div className="row-list-head">
              <span />
              <span>
                <Translation>Name</Translation>
              </span>
              <span>
                <Translation>Execute Workflow</Translation>
              </span>
              <span>
                <Translation>Payload</Translation>
              </span>
              <span>
                <Translation>Create Time</Translation>
              </span>
              <span />
            </div>
            {(triggers || []).map((item: Trigger) => {
              const expanded = !!open[item.name];
              return (
                <div key={item.name} className={`row-list-row ${expanded ? 'expanded' : ''}`}>
                  <div className="row-list-main">
                    <span className="row-list-chevron" onClick={() => this.toggle(item.name)}>
                      {expanded ? <AiOutlineDown /> : <AiOutlineRight />}
                    </span>
                    <span className="row-list-name" onClick={() => this.toggle(item.name)}>
                      <AiOutlineApi className="row-list-icon" />
                      <span>
                        <span className="row-list-title">{showAlias(item)}</span>
                        <span className="row-list-type">
                          {item.type == 'webhook' ? <Translation>On Webhook Event</Translation> : item.type}
                        </span>
                      </span>
                    </span>
                    <span>{item.workflowName}</span>
                    <span>{item.payloadType || <span className="row-list-muted">-</span>}</span>
                    <span>
                      {item.createTime ? (
                        <span title={momentDate(item.createTime)}>{beautifyTime(item.createTime)}</span>
                      ) : (
                        <span className="row-list-muted">-</span>
                      )}
                    </span>
                    <span className="row-list-actions">
                      <RowAction
                        icon={<AiOutlinePlayCircle />}
                        label="Trigger"
                        onClick={() => this.showWebhook(item)}
                      />
                      <RowAction icon={<AiOutlineEdit />} label="Edit" onClick={() => this.props.onEditTrigger(item)} />
                      <Permission
                        request={{
                          resource: `project:${projectName}/application:${applicationDetail?.name}/trigger:${item.name}`,
                          action: 'delete',
                        }}
                        project={projectName}
                      >
                        <RowAction
                          icon={<AiOutlineDelete />}
                          label="Delete"
                          danger
                          onClick={() => this.handleTriggerDelete(item.token || '')}
                        />
                      </Permission>
                    </span>
                  </div>
                  {expanded && (
                    <div className="row-list-detail">
                      {item.description && <p className="row-list-description">{item.description}</p>}
                      <dl className="row-list-properties">
                        <dt>
                          <Translation>Webhook URL</Translation>
                        </dt>
                        <dd>{`${domain}/api/v1/webhook/${item.token}`}</dd>
                        {item.componentName && (
                          <React.Fragment>
                            <dt>
                              <Translation>Component</Translation>
                            </dt>
                            <dd>{item.componentName}</dd>
                          </React.Fragment>
                        )}
                        {item.registry && (
                          <React.Fragment>
                            <dt>
                              <Translation>Registry</Translation>
                            </dt>
                            <dd>{item.registry}</dd>
                          </React.Fragment>
                        )}
                      </dl>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </If>
        <If condition={showTrigger}>
          <Dialog
            v2
            locale={locale().Dialog}
            visible={true}
            onClose={this.closeWebhook}
            footer={<div />}
            width={500}
            title={<Translation>Trigger Webhook</Translation>}
          >
            <Row>
              <Col span={24}>
                <Item
                  labelWidth={160}
                  label={<Translation>Webhook URL</Translation>}
                  value={
                    <div>
                      <a href={webHookURL}>{webHookURL}</a>
                      <CopyToClipboard
                        onCopy={() => {
                          Message.success('Copy successfully');
                        }}
                        text={webHookURL}
                      >
                        {copy}
                      </CopyToClipboard>
                    </div>
                  }
                />
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <Item labelWidth={160} label={<Translation>Method</Translation>} value={'Post'} />
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <Item
                  labelWidth={160}
                  label={<Translation>Header</Translation>}
                  value={'content-type: application/json'}
                />
              </Col>
            </Row>
            <h4>
              <Translation>Curl Command</Translation>
              <CopyToClipboard
                onCopy={() => {
                  Message.success('Copy successfully');
                }}
                text={command}
              >
                {copy}
              </CopyToClipboard>
            </h4>
            <Row>
              <Tab size="small" shape="wrapped">
                {customTriggerTypes.map((item: string) => (
                  <Tab.Item
                    className="justify-tabs-tab"
                    onClick={() => {
                      this.handleCustomTriggerTab(item);
                    }}
                    key={item}
                    title={item}
                  >
                    <Col span={24} className="curlCode">
                      <code>{command}</code>
                      <span>
                        <Translation>
                          Please set the properties that need to be changed, such as `image`, `step`.
                        </Translation>
                        <Message type="notice">
                          {' '}
                          If action is not provided then it will by default execute the workflow.
                        </Message>
                      </span>
                    </Col>
                  </Tab.Item>
                ))}
              </Tab>
            </Row>
          </Dialog>
        </If>
      </div>
    );
  }
}

export default TriggerList;
