import { Button, Dialog, Message, Table } from '@alifd/next';
import type { StaleProjectAccess } from '@velaux/data';
import i18n from 'i18next';
import React, { useCallback, useEffect, useState } from 'react';

import { listStaleProjectAccess, removeStaleProjectAccess } from '../../api/project';
import { ListTitle as Title } from '../../components/ListTitle';
import { Translation } from '../../components/Translation';
import { locale } from '../../utils/locale';

// ProjectAccess lists project groups still bound in namespaces after their project was deleted, for an admin to
// remove. A new project with the same name would otherwise inherit that access.
const ProjectAccess = () => {
  const [items, setItems] = useState<StaleProjectAccess[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    listStaleProjectAccess()
      .then((res: { items?: StaleProjectAccess[] }) => setItems(res?.items || []))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const remove = (access: StaleProjectAccess) => {
    Dialog.confirm({
      content: `${i18n.t('Remove the access left behind for deleted project')} ${access.project} ${i18n.t(
        'in namespace'
      )} ${access.namespace}?`,
      onOk: () =>
        removeStaleProjectAccess(access).then((res) => {
          if (res) {
            Message.success(i18n.t('Access removed'));
            load();
          }
        }),
      locale: locale().Dialog,
    });
  };

  const { Column } = Table;
  return (
    <div>
      <Title
        title="Project Access"
        subTitle="Namespaces that still grant access to deleted projects. A new project with the same name would get that access."
      />
      <Table
        locale={locale().Table}
        loading={loading}
        dataSource={items.map((a) => ({ ...a, key: `${a.namespace}/${a.binding}/${a.project}` }))}
        primaryKey="key"
      >
        <Column title={<Translation>Deleted project</Translation>} dataIndex="project" />
        <Column title={<Translation>Namespace</Translation>} dataIndex="namespace" />
        <Column title={<Translation>RoleBinding</Translation>} dataIndex="binding" />
        <Column title={<Translation>Role</Translation>} dataIndex="role" />
        <Column
          title={<Translation>Actions</Translation>}
          cell={(_: unknown, __: number, record: StaleProjectAccess) => (
            <Button text type="primary" className="danger-btn" onClick={() => remove(record)}>
              <Translation>Remove</Translation>
            </Button>
          )}
        />
      </Table>
    </div>
  );
};

export default ProjectAccess;
