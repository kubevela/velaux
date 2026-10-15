import { Balloon, Dialog, Table, Tag } from '@alifd/next';
import React, { Component } from 'react';

import Permission from '../../../../components/Permission';
import type { ApplicationDetail, ApplicationEnvStatus, ApplicationPolicyBase, EnvBinding } from '@velaux/data';
import { beautifyTime, momentDate } from '../../../../utils/common';
import './index.less';
import Empty from '../../../../components/Empty';
import { Translation } from '../../../../components/Translation';
import { locale } from '../../../../utils/locale';
import { AiOutlineDelete } from 'react-icons/ai';
import { policyRows, policyState, policyStateCircle, policyStateLabel } from '../../../../utils/policies';
import type { PolicyRow } from '../../../../utils/policies';
import { PolicyScopeTag } from '../../../../components/PolicyScopeTag';

type Props = {
  policies?: ApplicationPolicyBase[];
  // statuses carry how each environment's Application applied its policies,
  // and the global policies it received, which the application does not own.
  statuses?: ApplicationEnvStatus[];
  // policyScopes maps a policy type to how KubeVela applies it.
  policyScopes?: Record<string, string>;
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

  renderName = (row: PolicyRow) => {
    const name = row.policy ? (
      <a onClick={() => this.props.onShowPolicy(row.name)}>{row.policy.alias || row.name}</a>
    ) : (
      <span>{row.name}</span>
    );
    const title = (
      <span>
        {row.applied && <span className={`circle ${policyStateCircle[policyState(row.applied)]}`} />}
        {name}
      </span>
    );
    // The message says why a policy was skipped or failed.
    const help = row.applied?.message || row.policy?.description;
    if (!help) {
      return title;
    }
    return (
      <Balloon.Tooltip trigger={title} align="t">
        {help}
      </Balloon.Tooltip>
    );
  };

  render() {
    const { policies, statuses, policyScopes, envbinding, applicationDetail } = this.props;
    const envNameAlias: Record<string, string> = {};
    envbinding?.map((item) => {
      envNameAlias[item.name] = item.alias || item.name;
    });
    const projectName = applicationDetail && applicationDetail.project?.name;
    const rows = policyRows(policies, statuses);
    if (rows.length == 0) {
      return (
        <Empty
          style={{ minHeight: '400px' }}
          message={
            <span>
              <Translation>There are no policies</Translation>
            </span>
          }
        />
      );
    }
    return (
      <div className="policy-table">
        <Table
          style={{ minWidth: '900px' }}
          locale={locale().Table}
          dataSource={rows.map((row) => ({ ...row, key: `${row.global}-${row.envName}-${row.name}` }))}
          primaryKey="key"
        >
          <Table.Column
            dataIndex="name"
            title={<Translation>Name</Translation>}
            cell={(v: string, i: number, row: PolicyRow) => this.renderName(row)}
          />
          <Table.Column dataIndex="type" title={<Translation>Type</Translation>} />
          <Table.Column
            dataIndex="global"
            title={<Translation>Scope</Translation>}
            cell={(global: boolean, i: number, row: PolicyRow) => (
              <span className="policy-tags">
                <PolicyScopeTag scope={global ? 'Application' : (policyScopes || {})[row.type || '']} />
                {global && (
                  <Tag size="small">
                    <Translation>Global</Translation>
                  </Tag>
                )}
              </span>
            )}
          />
          <Table.Column
            dataIndex="envName"
            title={<Translation>Environment</Translation>}
            cell={(v?: string) => (v ? envNameAlias[v] || v : '-')}
          />
          <Table.Column
            dataIndex="applied"
            title={<Translation>Namespace</Translation>}
            cell={(v: any, i: number, row: PolicyRow) => (row.global && row.applied?.namespace) || '-'}
          />
          <Table.Column
            dataIndex="applied"
            title={<Translation>State</Translation>}
            cell={(v: any, i: number, row: PolicyRow) =>
              row.applied ? <Translation>{policyStateLabel[policyState(row.applied)]}</Translation> : '-'
            }
          />
          <Table.Column
            dataIndex="policy"
            title={<Translation>Create Time</Translation>}
            cell={(policy?: ApplicationPolicyBase) =>
              policy ? <span title={momentDate(policy.createTime)}>{beautifyTime(policy.createTime)}</span> : '-'
            }
          />
          <Table.Column
            dataIndex="policy"
            title={<Translation>Actions</Translation>}
            width={90}
            cell={(policy?: ApplicationPolicyBase) =>
              policy && (
                <Permission
                  request={{
                    resource: `project:${projectName}/application:${applicationDetail?.name}/policy:${policy.name}`,
                    action: 'delete',
                  }}
                  project={projectName}
                >
                  <AiOutlineDelete
                    size={14}
                    className="margin-right-0 cursor-pointer danger-icon"
                    onClick={() => {
                      this.handlePolicyDelete(policy.name);
                    }}
                  />
                </Permission>
              )
            }
          />
        </Table>
      </div>
    );
  }
}

export default PolicyList;
