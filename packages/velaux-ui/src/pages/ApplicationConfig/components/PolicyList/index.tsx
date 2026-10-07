import { Dialog } from '@alifd/next';
import React, { useState } from 'react';
import { AiOutlineControl, AiOutlineDelete, AiOutlineDown, AiOutlineEdit, AiOutlineRight } from 'react-icons/ai';

import Empty from '../../../../components/Empty';
import Permission from '../../../../components/Permission';
import { PolicyScopeTag } from '../../../../components/PolicyScopeTag';
import { flattenProperties, PropertyList } from '../../../../components/RowList';
import { RowAction } from '../../../../components/RowAction';
import type { Tone } from '../../../../components/StatusBadge';
import { StatusBadge } from '../../../../components/StatusBadge';
import { Translation } from '../../../../components/Translation';
import type { ApplicationDetail, ApplicationEnvStatus, ApplicationPolicyBase, EnvBinding } from '@velaux/data';
import { beautifyTime, momentDate } from '../../../../utils/common';
import { locale } from '../../../../utils/locale';
import type { PolicyRow, PolicyState } from '../../../../utils/policies';
import { policyRows, policyState, policyStateLabel } from '../../../../utils/policies';
import './index.less';

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

const stateTone: Record<PolicyState, Tone> = {
  applied: 'healthy',
  skipped: 'neutral',
  error: 'failed',
};

const rowKey = (row: PolicyRow) => `${row.global}-${row.envName}-${row.name}`;

// PolicyList lists an application's policies as rows, then the global
// policies its environments received: each one's scope, environment, and how
// it fared where KubeVela reports it. A row expands to its properties and the
// reason it was skipped or failed.
const PolicyList = (props: Props) => {
  const { policies, statuses, policyScopes, envbinding, applicationDetail } = props;
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (key: string) => setOpen({ ...open, [key]: !open[key] });
  const envAlias = (name?: string) => envbinding?.find((e) => e.name === name)?.alias || name;
  const projectName = applicationDetail?.project?.name;
  const confirmDelete = (name: string) =>
    Dialog.alert({
      content: 'Are you sure want to delete this policy?',
      onOk: () => props.onDeletePolicy(name),
      locale: locale().Dialog,
    });

  const rows = policyRows(policies, statuses);
  if (rows.length === 0) {
    return <Empty message={<Translation>There are no policies</Translation>} />;
  }
  return (
    <div className="row-list policy-list">
      <div className="row-list-head">
        <span />
        <span>
          <Translation>Name</Translation>
        </span>
        <span>
          <Translation>Scope</Translation>
        </span>
        <span>
          <Translation>Environment</Translation>
        </span>
        <span>
          <Translation>State</Translation>
        </span>
        <span>
          <Translation>Create Time</Translation>
        </span>
        <span />
      </div>
      {rows.map((row) => {
        const key = rowKey(row);
        const expanded = !!open[key];
        const state = row.applied && policyState(row.applied);
        const reason = row.applied?.message;
        return (
          <div key={key} className={`row-list-row ${expanded ? 'expanded' : ''}`}>
            <div className="row-list-main">
              <span className="row-list-chevron" onClick={() => toggle(key)}>
                {expanded ? <AiOutlineDown /> : <AiOutlineRight />}
              </span>
              <span className="row-list-name" onClick={() => toggle(key)}>
                <AiOutlineControl className="row-list-icon" />
                <span>
                  <span className="row-list-title">{row.policy?.alias || row.name}</span>
                  <span className="row-list-type">{row.type}</span>
                </span>
              </span>
              <span className="policy-list-scope">
                <PolicyScopeTag scope={row.global ? 'Application' : (policyScopes || {})[row.type || '']} />
                {row.global && (
                  <span className="policy-list-global">
                    <Translation>Global</Translation>
                  </span>
                )}
              </span>
              <span>{row.envName ? envAlias(row.envName) : <span className="row-list-muted">-</span>}</span>
              <span>
                {state ? (
                  <StatusBadge tone={stateTone[state]} label={policyStateLabel[state]} title={reason} />
                ) : (
                  <span className="row-list-muted">-</span>
                )}
              </span>
              <span>
                {row.policy ? (
                  <span title={momentDate(row.policy.createTime)}>{beautifyTime(row.policy.createTime)}</span>
                ) : (
                  <span className="row-list-muted">-</span>
                )}
              </span>
              <span className="row-list-actions">
                {row.policy && (
                  <React.Fragment>
                    <RowAction icon={<AiOutlineEdit />} label="Edit" onClick={() => props.onShowPolicy(row.name)} />
                    <Permission
                      request={{
                        resource: `project:${projectName}/application:${applicationDetail?.name}/policy:${row.name}`,
                        action: 'delete',
                      }}
                      project={projectName}
                    >
                      <RowAction
                        icon={<AiOutlineDelete />}
                        label="Delete"
                        danger
                        onClick={() => confirmDelete(row.name)}
                      />
                    </Permission>
                  </React.Fragment>
                )}
              </span>
            </div>
            {expanded && (
              <div className="row-list-detail">
                {row.policy?.description && <p className="row-list-description">{row.policy.description}</p>}
                {reason && <p className="row-list-description">{reason}</p>}
                {row.global && row.applied?.namespace && (
                  <p className="row-list-description">
                    <Translation>From namespace</Translation> {row.applied.namespace}
                  </p>
                )}
                <div className="row-list-detail-title">
                  <Translation>Properties</Translation>
                </div>
                {row.policy && flattenProperties(row.policy.properties).length > 0 ? (
                  <PropertyList properties={row.policy.properties} />
                ) : (
                  <span className="row-list-muted">
                    {row.global ? (
                      <Translation>A global policy, managed outside this application</Translation>
                    ) : (
                      <Translation>No properties</Translation>
                    )}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PolicyList;
