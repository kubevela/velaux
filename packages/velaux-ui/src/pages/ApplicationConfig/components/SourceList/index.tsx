import { Card, Dialog, Grid } from '@alifd/next';
import React from 'react';
import { AiOutlineDelete } from 'react-icons/ai';

import Empty from '../../../../components/Empty';
import { If } from '../../../../components/If';
import Item from '../../../../components/Item';
import Permission from '../../../../components/Permission';
import { Translation } from '../../../../components/Translation';
import type { ApplicationDetail, ApplicationSource } from '@velaux/data';
import { locale } from '../../../../utils/locale';
import '../PolicyList/index.less';

type Props = {
  sources: ApplicationSource[];
  applicationDetail?: ApplicationDetail;
  onDeleteSource: (name: string) => void;
  onShowSource: (source: ApplicationSource) => void;
};

const { Row, Col } = Grid;

const SourceList = ({ sources, applicationDetail, onDeleteSource, onShowSource }: Props) => {
  const projectName = applicationDetail?.project?.name;
  const confirmDelete = (name: string) => {
    Dialog.alert({
      content: 'Are you sure want to delete this source?',
      onOk: () => onDeleteSource(name),
      locale: locale().Dialog,
    });
  };
  return (
    <div className="list-warper">
      <div className="box">
        <Row wrap={true}>
          {sources.map((item) => (
            <Col span={24} key={item.name} className="box-item">
              <Card free={true} style={{ padding: '16px' }} hasBorder contentHeight="auto" locale={locale().Card}>
                <div className="policy-list-nav">
                  <div className="policy-list-title">
                    <a onClick={() => onShowSource(item)}>{item.name}</a>
                  </div>
                  <div className="trigger-list-operation">
                    <Permission
                      request={{
                        resource: `project:${projectName}/application:${applicationDetail?.name}/source:${item.name}`,
                        action: 'delete',
                      }}
                      project={projectName}
                    >
                      <AiOutlineDelete
                        size={14}
                        className="margin-right-0 cursor-pointer danger-icon"
                        onClick={() => confirmDelete(item.name)}
                      />
                    </Permission>
                  </div>
                </div>
                <div className="policy-list-content">
                  <Item marginBottom="8px" labelWidth={160} label={<Translation>Type</Translation>} value={item.type} />
                  <Item
                    marginBottom="8px"
                    labelWidth={160}
                    label={<Translation>Auto Update</Translation>}
                    value={item.autoUpdate === undefined ? 'Default' : item.autoUpdate ? 'On' : 'Off'}
                  />
                  <Item
                    marginBottom="8px"
                    labelWidth={160}
                    label={<Translation>Read with</Translation>}
                    value={<code>{`$(source.${item.name})`}</code>}
                  />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
        <If condition={sources.length == 0}>
          <Empty
            style={{ minHeight: '400px' }}
            message={
              <span>
                <Translation>There are no sources</Translation>
              </span>
            }
          />
        </If>
      </div>
    </div>
  );
};

export default SourceList;
