import { Dialog, Table, Tag } from '@alifd/next';
import React, { useEffect, useState } from 'react';

import type { DefinitionBase, NamespaceUsage } from '@velaux/data';

import { getDefinitionUsage } from '../../../../api/definitions';
import { RestrictionTags } from '../../../../components/RestrictionTags';
import { Translation } from '../../../../components/Translation';
import { locale } from '../../../../utils/locale';
import { usageState } from '../../../../utils/restrictions';
import type { DefinitionPlace } from '../../../../utils/definitionPlace';

type Props = {
  definition: DefinitionBase;
  definitionType: 'component' | 'trait';
  // place is where the definition is, as the list shows it.
  place: DefinitionPlace;
  onClose: () => void;
};

const levelCell = (v?: number) => (v === undefined ? '-' : v);

const stateColors: Record<string, string | undefined> = { success: 'green', warning: 'orange', error: 'red' };

// UsageDialog shows how much each namespace uses a definition, counted as the
// Application webhook counts it, against the quota entry governing it.
export const UsageDialog = (props: Props) => {
  const [usage, setUsage] = useState<NamespaceUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const { project, where } = props.place;
  useEffect(() => {
    getDefinitionUsage({ project, where, name: props.definition.name, type: props.definitionType })
      .then((res) => setUsage((res && res.usage) || []))
      .finally(() => setLoading(false));
  }, [props.definition.name, props.definitionType, project, where]);
  return (
    <Dialog
      v2
      visible
      width={720}
      locale={locale().Dialog}
      title={
        <span>
          <Translation>Usage</Translation>: {props.definition.name}
        </span>
      }
      onClose={props.onClose}
      footer={false}
    >
      <div style={{ marginBottom: '12px' }}>
        <RestrictionTags restrictions={props.definition.restrictions} />
      </div>
      <Table locale={locale().Table} dataSource={usage} loading={loading} primaryKey="namespace">
        <Table.Column dataIndex="namespace" title={<Translation>Namespace</Translation>} />
        <Table.Column dataIndex="used" title={<Translation>Used</Translation>} width={80} />
        <Table.Column dataIndex="warn" title={<Translation>Warn at</Translation>} width={90} cell={levelCell} />
        <Table.Column dataIndex="limit" title={<Translation>Limit</Translation>} width={80} cell={levelCell} />
        <Table.Column
          dataIndex="state"
          title={<Translation>State</Translation>}
          width={140}
          cell={(v: NamespaceUsage['state']) => {
            const state = usageState(v);
            return (
              <Tag size="small" color={stateColors[state.type]}>
                <Translation>{state.label}</Translation>
              </Tag>
            );
          }}
        />
      </Table>
    </Dialog>
  );
};
