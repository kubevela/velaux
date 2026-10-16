import { Select } from '@alifd/next';
import React, { useEffect, useState } from 'react';

import { listDefinitionRevisions } from '../../api/definitions';
import i18n from '../../i18n';
import { momentDate } from '../../utils/common';
import type { DefinitionRevision } from '../../utils/definitionVersion';
import { isNamed, latestLabel, versionLabel } from '../../utils/definitionVersion';
import { locale } from '../../utils/locale';
import { Translation } from '../Translation';
import './index.less';

type Props = {
  // definitionType is component, trait, policy or source.
  definitionType: string;
  // name is the definition chosen; there is no version to pick without one.
  name?: string;
  // value is the version pinned, or none to follow the latest.
  value?: string;
  onChange: (version?: string) => void;
  disabled?: boolean;
};

// latest is the select's value for following the definition's latest version.
const latest = '';

// VersionSelect picks the version of a definition a type is pinned to. Pinning
// is optional but recommended: a type that follows the latest changes when
// the definition does.
export const VersionSelect = (props: Props) => {
  const { definitionType, name, value, onChange, disabled } = props;
  const [revisions, setRevisions] = useState<DefinitionRevision[]>([]);

  useEffect(() => {
    if (!name) {
      setRevisions([]);
      return;
    }
    listDefinitionRevisions({ name, type: definitionType }).then((res: any) => {
      setRevisions(res?.revisions || []);
    });
  }, [name, definitionType]);

  const newest = revisions[0];
  const dates: Record<string, string> = {};
  revisions.forEach((r) => (dates[r.version] = momentDate(r.createTime)));
  const option = (r: DefinitionRevision) => ({ value: r.version, label: versionLabel(r) });
  const named = revisions.filter(isNamed).map(option);
  const numbered = revisions.filter((r) => !isNamed(r)).map(option);
  // Sections: following the latest, then named versions, then bare revisions.
  const options = [
    { label: i18n.t('Latest').toString(), children: [{ value: latest, label: latestLabel(newest) }] },
    ...(named.length > 0 ? [{ label: i18n.t('Versions').toString(), children: named }] : []),
    ...(numbered.length > 0 ? [{ label: i18n.t('Revisions').toString(), children: numbered }] : []),
  ];
  return (
    <div className="version-select">
      <Select
        value={value || latest}
        dataSource={options}
        showSearch
        itemRender={(item: any) => (
          <span className="version-option">
            <span>{item.label}</span>
            {dates[item.value] && <span className="version-option-date">{dates[item.value]}</span>}
          </span>
        )}
        disabled={disabled || !name}
        locale={locale().Select}
        onChange={(v: string) => onChange(v || undefined)}
        aria-label={i18n.t('Version').toString()}
      />
      {name && !value && (
        <div className="version-select-hint">
          <Translation>
            Pinning a version is recommended, so changes to the definition reach this only when you choose.
          </Translation>
        </div>
      )}
    </div>
  );
};
