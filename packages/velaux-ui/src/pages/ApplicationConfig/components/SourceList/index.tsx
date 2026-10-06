import { Dialog } from '@alifd/next';
import React, { useState } from 'react';
import { AiOutlineDelete, AiOutlineDown, AiOutlineEdit, AiOutlineImport, AiOutlineRight } from 'react-icons/ai';

import Empty from '../../../../components/Empty';
import Permission from '../../../../components/Permission';
import { flattenProperties, PropertyList } from '../../../../components/RowList';
import { RowAction } from '../../../../components/RowAction';
import { Translation } from '../../../../components/Translation';
import type { ApplicationDetail, ApplicationSource } from '@velaux/data';
import { locale } from '../../../../utils/locale';
import './index.less';

type Props = {
  sources: ApplicationSource[];
  applicationDetail?: ApplicationDetail;
  onDeleteSource: (name: string) => void;
  onShowSource: (source: ApplicationSource) => void;
};

const autoUpdateLabel = (autoUpdate?: boolean) => (autoUpdate === undefined ? 'Default' : autoUpdate ? 'On' : 'Off');

// SourceList lists an application's sources as rows: each one's type, whether
// it re-dispatches on change, and how to read it. A row expands to its
// properties.
const SourceList = ({ sources, applicationDetail, onDeleteSource, onShowSource }: Props) => {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const projectName = applicationDetail?.project?.name;
  const toggle = (name: string) => setOpen({ ...open, [name]: !open[name] });
  const confirmDelete = (name: string) => {
    Dialog.alert({
      content: 'Are you sure want to delete this source?',
      onOk: () => onDeleteSource(name),
      locale: locale().Dialog,
    });
  };
  if (sources.length === 0) {
    return <Empty message={<Translation>There are no sources</Translation>} />;
  }
  return (
    <div className="row-list source-list">
      <div className="row-list-head">
        <span />
        <span>
          <Translation>Name</Translation>
        </span>
        <span>
          <Translation>Auto Update</Translation>
        </span>
        <span>
          <Translation>Read with</Translation>
        </span>
        <span />
      </div>
      {sources.map((item) => {
        const expanded = !!open[item.name];
        return (
          <div key={item.name} className={`row-list-row ${expanded ? 'expanded' : ''}`}>
            <div className="row-list-main">
              <span className="row-list-chevron" onClick={() => toggle(item.name)}>
                {expanded ? <AiOutlineDown /> : <AiOutlineRight />}
              </span>
              <span className="row-list-name" onClick={() => toggle(item.name)}>
                <AiOutlineImport className="row-list-icon" />
                <span>
                  <span className="row-list-title">{item.name}</span>
                  <span className="row-list-type">{item.type}</span>
                </span>
              </span>
              <span>
                <Translation>{autoUpdateLabel(item.autoUpdate)}</Translation>
              </span>
              <span>
                <code className="row-list-code">{`$(source.${item.name})`}</code>
              </span>
              <span className="row-list-actions">
                {!applicationDetail?.readOnly && (
                  <RowAction icon={<AiOutlineEdit />} label="Edit" onClick={() => onShowSource(item)} />
                )}
                {!applicationDetail?.readOnly && (
                  <Permission
                    request={{
                      resource: `project:${projectName}/application:${applicationDetail?.name}/source:${item.name}`,
                      action: 'delete',
                    }}
                    project={projectName}
                  >
                    <RowAction
                      icon={<AiOutlineDelete />}
                      label="Delete"
                      danger
                      onClick={() => confirmDelete(item.name)}
                    />
                  </Permission>
                )}
              </span>
            </div>
            {expanded && (
              <div className="row-list-detail">
                <div className="row-list-detail-title">
                  <Translation>Properties</Translation>
                </div>
                {flattenProperties(item.properties).length === 0 ? (
                  <span className="row-list-muted">
                    <Translation>No properties</Translation>
                  </span>
                ) : (
                  <PropertyList properties={item.properties} />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SourceList;
