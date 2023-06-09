import { Card, Dialog, Grid, Message , Tab } from '@alifd/next';
import React, { Component } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import { getApplicationComponent } from '../../../../api/application';
import Empty from '../../../../components/Empty';
import { If } from '../../../../components/If';
import Item from '../../../../components/Item';
import Permission from '../../../../components/Permission';
import { Translation } from '../../../../components/Translation';
import type {
  ApplicationComponentBase,
  ApplicationComponent,
  Trigger,
  ApplicationDetail,
} from '@velaux/data';
import { momentDate, showAlias } from '../../../../utils/common';
import './index.less';
import { locale } from '../../../../utils/locale';
import { AiOutlineDelete } from 'react-icons/ai';

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
};

class TriggerList extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

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
  }

  render() {
    const { Row, Col } = Grid;
    const { triggers, applicationDetail } = this.props;

    const { showTrigger, component, customTriggerType } = this.state;

    const domain = `${window.location.protocol}//${window.location.host}`;
    const webHookURL = `${domain}/api/v1/webhook/${showTrigger?.token}`;
    let command = `curl -X POST -H 'content-type: application/json' --url ${webHookURL}`;

    if (showTrigger?.payloadType == 'custom' && component) {
      const customTriggerBody: {[x: string]: Object} = {
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
        approve:{
          action: 'approve',
          step : 'suspend'
        },
        terminate:{
          action: 'terminate',
          step : 'suspend'
        },
        rollback :{
          action: 'rollback',
          step : 'suspend'
        }
      }
      let body =  customTriggerType ? customTriggerBody[customTriggerType] : " ";
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
      <div className="list-warper">
        <div className="box">
          {(triggers || []).map((item: Trigger) => (
            <Row wrap={true} key={item.type} className="box-item">
              <Col span={24}>
                <Card free={true} style={{ padding: '16px' }} locale={locale().Card}>
                  <div className="trigger-list-nav">
                    <div
                      onClick={() => {
                        this.props.onEditTrigger(item);
                      }}
                      className="trigger-list-title"
                    >
                      {showAlias(item)}
                    </div>
                    <div className="trigger-list-operation">
                      <Permission
                        request={{
                          resource: `project:${projectName}/application:${applicationDetail?.name}/trigger:${item.name}`,
                          action: 'delete',
                        }}
                        project={projectName}
                      >
                        <AiOutlineDelete
                          size={14}
                          className="margin-right-0 cursor-pointer danger-icon"
                          onClick={() => {
                            this.handleTriggerDelete(item.token || '');
                          }}
                        />
                      </Permission>
                    </div>
                  </div>
                  <div className="trigger-list-content">
                    <Row>
                      <Col span={24}>
                        <Item
                          marginBottom="8px"
                          labelWidth={160}
                          label={<Translation>Type</Translation>}
                          value={item.type == 'webhook' ? <Translation>On Webhook Event</Translation> : item.type}
                        />
                      </Col>
                    </Row>
                    <Row>
                      <Col span={24}>
                        <Item
                          marginBottom="8px"
                          labelWidth={160}
                          label={<Translation>Execute Workflow</Translation>}
                          value={item.workflowName}
                        />
                      </Col>
                    </Row>
                    <Row>
                      <Col span={24}>
                        <Item
                          marginBottom="8px"
                          labelWidth={160}
                          label={<Translation>Create Time</Translation>}
                          value={momentDate(item.createTime)}
                        />
                      </Col>
                    </Row>
                    <Row>
                      <Col>
                        <div className="trigger-list-operation">
                          <a
                            onClick={() => {
                              this.showWebhook(item);
                            }}
                          >
                            <Translation>Manual Trigger</Translation>
                          </a>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Card>
              </Col>
            </Row>
          ))}
          <If condition={!triggers || triggers.length == 0}>
            <Empty
              style={{ minHeight: '400px' }}
              message={
                <span>
                  <Translation>There are no triggers</Translation>
                </span>
              }
            />
          </If>
        </div>
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
              {(customTriggerTypes).map((item: string) => (
                  <Tab.Item className="justify-tabs-tab" onClick={()=>{this.handleCustomTriggerTab(item)}} key={item} title={item}>
                  <Col span={24} className="curlCode">
                  <code>{command}</code>
                  <span>
                    <Translation>Please set the properties that need to be changed, such as `image`, `step`.</Translation>
                    <Message type='notice'> If action is not provided then it will by default execute the workflow.</Message>
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
