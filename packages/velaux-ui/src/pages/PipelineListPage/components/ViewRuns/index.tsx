import { Balloon, Button, Dialog, Table, Message } from '@alifd/next';
import classNames from 'classnames';
import { Link } from 'dva/router';
import React, { useState, useEffect } from 'react';
import { AiFillDelete } from 'react-icons/ai';

import { deletePipelineRun, loadPipelineRuns } from '../../../../api/pipeline';
import { If } from '../../../../components/If';
import Permission from '../../../../components/Permission';
import { Translation } from '../../../../components/Translation';
import i18n from '../../../../i18n';
import type { PipelineListItem, PipelineRunBriefing } from '@velaux/data';
import { momentDate, timeDiff } from '../../../../utils/common';
import { locale } from '../../../../utils/locale';

export interface ViewRunsProps {
  pipeline: PipelineListItem;
  onClose: () => void;
}

const ViewRuns = (props: ViewRunsProps) => {
  const [loading, setLoading] = useState(true);
  const [runs, setRuns] = useState<PipelineRunBriefing[]>([]);
  const { pipeline } = props;

  useEffect(() => {
    if (loading) {
      loadPipelineRuns({ projectName: pipeline.project.name, pipelineName: pipeline.name })
        .then((res: { runs?: PipelineRunBriefing[] }) => {
          setRuns(res && res.runs ? res.runs : []);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [pipeline, loading]);

  const deleteRun = (name: string) => {
    if (name) {
      Dialog.confirm({
        type: 'confirm',
        content: <Translation>Unrecoverable after deletion, are you sure to delete it?</Translation>,
        onOk: () => {
          deletePipelineRun({
            projectName: pipeline.project.name,
            pipelineName: pipeline.name,
            runName: name,
          }).then((res) => {
            if (res) {
              Message.success(i18n.t('The Pipeline Run removed successfully'));
              setLoading(true);
            }
          });
        },
        locale: locale().Dialog,
      });
    }
  };

  return (
    <Dialog
      v2
      visible={true}
      locale={locale().Dialog}
      title={i18n.t('Pipeline Runs').toString()}
      onClose={props.onClose}
      onCancel={props.onClose}
      footerActions={['cancel']}
      overflowScroll={true}
      style={{ width: '1200px' }}
    >
      <Table loading={loading} dataSource={runs} locale={locale().Table}>
        <Table.Column
          key={'name'}
          dataIndex="pipelineRunName"
          title={i18n.t('Name').toString()}
          cell={(name: string) => {
            return (
              <Link to={`/projects/${props.pipeline.project.name}/pipelines/${props.pipeline.name}/runs/${name}`}>
                {name}
              </Link>
            );
          }}
        />
        <Table.Column
          key={'status'}
          dataIndex="phase"
          title={i18n.t('Status').toString()}
          cell={(phase: string, i: number, run: PipelineRunBriefing) => {
            const show = (
              <span
                className={classNames({
                  colorRed: phase == 'failed',
                  colorGreen: phase == 'succeeded',
                })}
              >
                {phase.toUpperCase()}
              </span>
            );
            if (run.message) {
              return <Balloon trigger={show}>{run.message}</Balloon>;
            }
            return show;
          }}
        />
        <Table.Column
          key={'startTime'}
          dataIndex="startTime"
          title={i18n.t('Start Time').toString()}
          cell={(value: string) => {
            return momentDate(value);
          }}
        />
        <Table.Column
          key={'endTime'}
          dataIndex="endTime"
          title={i18n.t('End Time').toString()}
          cell={(value: string) => {
            return momentDate(value);
          }}
        />

        <Table.Column
          key={'endTime'}
          dataIndex="endTime"
          title={i18n.t('Duration').toString()}
          cell={(value: string, i: number, run: PipelineRunBriefing) => {
            return timeDiff(run.startTime, run.endTime);
          }}
        />
        <Table.Column
          key={'contextName'}
          dataIndex="contextName"
          title={i18n.t('Context Name').toString()}
          cell={(value: string) => {
            return value;
          }}
        />

        <Table.Column
          key={'actions'}
          dataIndex="pipelineRunName"
          title={i18n.t('Actions').toString()}
          cell={(name: string, i: number, run: PipelineRunBriefing) => {
            return (
              <div>
                <If condition={run.phase != 'executing'}>
                  <Permission
                    project={props.pipeline.project.name}
                    resource={{
                      resource: `project:${props.pipeline.project.name}/pipeline:${props.pipeline.name}/pipelineRun:${name}`,
                      action: 'delete',
                    }}
                  >
                    <Button
                      text
                      size={'small'}
                      className={'danger-btn'}
                      component={'a'}
                      onClick={() => {
                        deleteRun(name);
                      }}
                    >
                      <AiFillDelete />
                      <Translation>Remove</Translation>
                    </Button>
                  </Permission>
                </If>
              </div>
            );
          }}
        />
      </Table>
    </Dialog>
  );
};

export default ViewRuns;
