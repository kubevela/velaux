import { Balloon, Card, Dialog, Grid } from '@alifd/next';
import React, { Component } from 'react';

import { If } from '../../../../components/If';
import Item from '../../../../components/Item';
import Permission from '../../../../components/Permission';
import type { ApplicationDetail, ApplicationPolicyBase, EnvBinding } from '@velaux/data';
import { beautifyTime, momentDate } from '../../../../utils/common';
import './index.less';
import Empty from '../../../../components/Empty';
import { Translation } from '../../../../components/Translation';
import { locale } from '../../../../utils/locale';
import { AiOutlineDelete } from 'react-icons/ai';

type Props = {
  policies?: ApplicationPolicyBase[];
  envbinding?: EnvBinding[];
  applicationDetail?: ApplicationDetail;
  onDeletePolicy: (name: string) => void;
  onShowPolicy: (name: string) => void;
};

type State = {};

class PolicyList extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  handlePolicyDelete = (name: string) => {
    Dialog.alert({
      content: 'Are you sure want to delete this policy?',
      onOk: () => {
        this.props.onDeletePolicy(name);
      },
      onClose: () => {},
      locale: locale().Dialog,
    });
  };

  render() {
    const { Row, Col } = Grid;
    const { policies, envbinding, applicationDetail } = this.props;
    const envNameAlias: any = {};
    envNameAlias[''] = '-';
    envbinding?.map((item) => {
      envNameAlias[item.name] = item.alias;
    });
    const projectName = applicationDetail && applicationDetail.project?.name;
    return (
      <div className="list-warper">
        <div className="box">
          <Row wrap={true}>
            {(policies || []).map((item: ApplicationPolicyBase) => (
              <Col span={24} key={item.type + item.name} className="box-item">
                <Card free={true} style={{ padding: '16px' }} hasBorder contentHeight="auto" locale={locale().Card}>
                  <div className="policy-list-nav">
                    <div className="policy-list-title">
                      <a onClick={() => this.props.onShowPolicy(item.name)}>
                        <Balloon trigger={<span>{item.alias ? item.alias : item.name}</span>}>
                          {item.description}
                        </Balloon>
                      </a>
                    </div>
                    <div className="trigger-list-operation">
                      <Permission
                        request={{
                          resource: `project:${projectName}/application:${applicationDetail?.name}/policy:${item.name}`,
                          action: 'delete',
                        }}
                        project={projectName}
                      >
                        <AiOutlineDelete
                          size={14}
                          className="margin-right-0 cursor-pointer danger-icon"
                          onClick={() => {
                            this.handlePolicyDelete(item.name);
                          }}
                        />
                      </Permission>
                    </div>
                  </div>
                  <div className="policy-list-content">
                    <Row wrap={true}>
                      <Col span={24}>
                        <Item
                          marginBottom="8px"
                          labelWidth={160}
                          label={<Translation>Type</Translation>}
                          value={item.type}
                        />
                      </Col>
                      <Col span={24}>
                        <Item
                          marginBottom="8px"
                          labelWidth={160}
                          label={<Translation>Environment</Translation>}
                          value={envNameAlias[item.envName || '']}
                        />
                      </Col>
                      <Col span={24}>
                        <Item
                          marginBottom="8px"
                          labelWidth={160}
                          label={<Translation>Create Time</Translation>}
                          value={<span title={momentDate(item.createTime)}>{beautifyTime(item.createTime)}</span>}
                        />
                      </Col>
                    </Row>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
          <If condition={!policies || policies.length == 0}>
            <Empty
              style={{ minHeight: '400px' }}
              message={
                <span>
                  <Translation>There are no policies</Translation>
                </span>
              }
            />
          </If>
        </div>
      </div>
    );
  }
}

export default PolicyList;
