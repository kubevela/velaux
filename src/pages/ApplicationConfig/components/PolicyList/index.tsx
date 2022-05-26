import React, { Component } from 'react';
import { Card, Dialog, Grid } from '@b-design/ui';
import type {
  ApplicationDetail,
  ApplicationPolicyBase,
  EnvBinding,
} from '../../../../interface/application';
import { momentDate } from '../../../../utils/common';
import './index.less';
import { If } from 'tsx-control-statements/components';
import Empty from '../../../../components/Empty';
import Translation from '../../../../components/Translation';
import locale from '../../../../utils/locale';
import Item from '../../../../components/Item';
// import Permission from '../../../../components/Permission';

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
    const { policies, envbinding } = this.props;
    const envNameAlias: any = {};
    envNameAlias[''] = '-';
    envbinding?.map((item) => {
      envNameAlias[item.name] = item.alias;
    });
    //const projectName = applicationDetail && applicationDetail.project?.name;
    return (
      <div className="list-warper">
        <div className="box">
          {(policies || []).map((item: ApplicationPolicyBase) => (
            <Row wrap={true} className="box-item">
              <Col span={24} key={item.type}>
                <Card free={true} style={{ padding: '16px' }} locale={locale().Card}>
                  <div className="policy-list-nav">
                    <div className="policy-list-title">
                      {/* <a onClick={() => this.props.onShowPolicy(item.name)}> */}
                      {item.alias ? `${item.alias}(${item.name})` : item.name}
                      {/* </a> */}
                    </div>
                    {/* <div className="trigger-list-operation">
                    <Permission
                      request={{
                        resource: `project:${projectName}/application/policy:${item.name}`,
                        action: 'delete',
                      }}
                      project={projectName}
                    >
                      <Icon
                        type="ashbin1"
                        size={14}
                        className="margin-right-0 cursor-pointer"
                        onClick={() => {
                          this.handlePolicyDelete(item.name);
                        }}
                      />
                    </Permission>
                  </div> */}
                  </div>
                  <div className="policy-list-content">
                    <Row wrap={true}>
                      <Col span={24}>
                        <Item
                          marginBottom="8px"
                          labelSpan={12}
                          label={<Translation>Type</Translation>}
                          value={item.type}
                        />
                      </Col>
                      <Col span={24}>
                        <Item
                          marginBottom="8px"
                          labelSpan={12}
                          label={<Translation>Environment</Translation>}
                          value={envNameAlias[item.envName || '']}
                        />
                      </Col>
                      <Col span={24}>
                        <Item
                          marginBottom="8px"
                          labelSpan={12}
                          label={<Translation>Create Time</Translation>}
                          value={momentDate(item.createTime)}
                        />
                      </Col>
                    </Row>
                  </div>
                </Card>
              </Col>
            </Row>
          ))}
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
