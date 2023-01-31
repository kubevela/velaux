import React, { useState, useEffect } from 'react';
import { Button, Checkbox, Dialog, Loading, Message, Tag } from '@b-design/ui';
import { deletePipelineContext, listPipelineContexts, runPipeline } from '../../api/pipeline';
import i18n from '../../i18n';
import type { KeyValue, PipelineListItem } from '../../interface/pipeline';
import './index.less';
import locale from '../../utils/locale';
import ListTitle from '../ListTitle';
import classNames from 'classnames';
import { If } from 'tsx-control-statements/components';
import NewContext from './new-context';
import Translation from '../Translation';
import Permission from '../Permission';
import { BiCopyAlt } from 'react-icons/bi';
import { AiFillDelete, AiFillSetting } from 'react-icons/ai';

export interface PipelineProps {
  pipeline: PipelineListItem;
  onClose: () => void;
  onSuccess?: (runName: string) => void;
}

const RunPipeline = (props: PipelineProps) => {
  const [loading, setLoading] = useState(true);
  const [contexts, setContexts] = useState<Record<string, KeyValue[]>>({});
  const [context, setContext] = useState<{ name: string; values: KeyValue[]; clone: boolean }>();
  const [noContext, setNoContext] = useState<boolean>();
  const [contextName, setSelectContextName] = useState('');
  const [addContext, showAddContext] = useState(false);
  const { pipeline } = props;

  const onClonePipelineContext = (key: string) => {
    showAddContext(true);
    setContext({ name: key, values: contexts[key], clone: true });
  };

  const onEditPipelineContext = (key: string) => {
    showAddContext(true);
    setContext({ name: key, values: contexts[key], clone: false });
  };

  const onDeletePipelineContext = (key: string) => {
    Dialog.confirm({
      type: 'confirm',
      content: <Translation>Unrecoverable after deletion, are you sure to delete it?</Translation>,
      onOk: () => {
        deletePipelineContext(pipeline.project.name, pipeline.name, key).then((res) => {
          if (res) {
            Message.success(i18n.t('The Pipeline context removed successfully'));
            setLoading(true);
          }
        });
      },
      locale: locale().Dialog,
    });
  };

  useEffect(() => {
    if (loading) {
      listPipelineContexts(pipeline.project.name, pipeline.name)
        .then((res) => {
          setContexts(res && res.contexts ? res.contexts : {});
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [pipeline, loading]);

  const onRunPipeline = () => {
    if (!contextName && !noContext) {
    }
    runPipeline(pipeline.project.name, pipeline.name, contextName).then((res) => {
      if (res) {
        if (props.onSuccess) {
          props.onSuccess(res.pipelineRunName);
        }
      }
    });
  };
  const okButtonDisable = !contextName && !noContext;
  return (
    <Dialog
      className="commonDialog"
      visible={true}
      locale={locale().Dialog}
      title={i18n.t('Run Pipeline')}
      onClose={props.onClose}
      onCancel={props.onClose}
      onOk={onRunPipeline}
      isFullScreen={true}
      okProps={{
        disabled: okButtonDisable,
      }}
    >
      <Loading style={{ width: '100%' }} visible={loading}>
        <div className="context-box">
          <ListTitle
            title={i18n.t('Select Contexts')}
            subTitle={i18n.t('The context is the runtime inputs for the Pipeline')}
            buttonSize={'small'}
            addButtonTitle="New Context"
            addButtonClick={() => {
              showAddContext(true);
            }}
          />
          {Object.keys(contexts).map((key: string) => {
            return (
              <div
                key={key}
                className={classNames('context-item', { active: contextName === key })}
                onClick={() => {
                  if (contextName != key) {
                    setSelectContextName(key);
                  } else {
                    setSelectContextName('');
                  }
                }}
                title={
                  contextName === key ? i18n.t('Click and deselect') : i18n.t('Click and select')
                }
              >
                <div className="context-name">{key}</div>
                <div className="context-values">
                  {Array.isArray(contexts[key]) &&
                    contexts[key].map((item) => {
                      return (
                        <Tag
                          style={{ marginBottom: '8px' }}
                          key={item.key}
                        >{`${item.key}=${item.value}`}</Tag>
                      );
                    })}
                </div>
                <div className="actions">
                  <Permission
                    request={{
                      resource: `project:${pipeline.project.name}/pipeline:${pipeline.name}/context:${key}`,
                      action: 'update',
                    }}
                    project={pipeline.project.name}
                  >
                    <Button
                      className="margin-left-10"
                      text={true}
                      component={'a'}
                      size={'medium'}
                      ghost={true}
                      onClick={(event) => {
                        onEditPipelineContext(key);
                        event.stopPropagation();
                      }}
                    >
                      <AiFillSetting />
                      <Translation>Edit</Translation>
                    </Button>
                    <span className="line" />
                  </Permission>
                  <Permission
                    project={pipeline.project.name}
                    resource={{
                      resource: `project:${pipeline.project.name}/pipeline:${pipeline.name}/context:${key}`,
                      action: 'create',
                    }}
                  >
                    <Button
                      text
                      size={'medium'}
                      ghost={true}
                      component={'a'}
                      onClick={(event) => {
                        onClonePipelineContext(key);
                        event.stopPropagation();
                      }}
                    >
                      <BiCopyAlt /> <Translation>Clone</Translation>
                    </Button>
                    <span className="line" />
                  </Permission>
                  <Permission
                    project={pipeline.project.name}
                    resource={{
                      resource: `project:${pipeline.project.name}/pipeline:${pipeline.name}/context:${key}`,
                      action: 'delete',
                    }}
                  >
                    <Button
                      text
                      size={'medium'}
                      ghost={true}
                      className={'danger-btn'}
                      component={'a'}
                      onClick={(event) => {
                        onDeletePipelineContext(key);
                        event.stopPropagation();
                      }}
                    >
                      <AiFillDelete />
                      <Translation>Remove</Translation>
                    </Button>
                  </Permission>
                </div>
              </div>
            );
          })}
          <If condition={addContext}>
            <div className="context-item">
              <NewContext
                clone={context?.clone}
                context={context}
                pipeline={props.pipeline}
                onCancel={() => showAddContext(false)}
                onSuccess={() => {
                  setLoading(true);
                  showAddContext(false);
                }}
              />
            </div>
          </If>
          <If condition={Object.keys(contexts).length == 0 && !addContext}>
            <div style={{ width: '100%' }}>
              <Message type="notice">
                <Translation>There is no context option.</Translation>
              </Message>
            </div>
          </If>
          <If condition={contextName == ''}>
            <div className="notice">
              <Checkbox
                onChange={(v: boolean) => {
                  setNoContext(v);
                }}
                checked={noContext}
                style={{ marginRight: '8px' }}
              />
              <Translation>No context is required for the execution of this Pipeline</Translation>
            </div>
          </If>
          <If condition={contextName != ''}>
            <span className="notice success">Selected a context: {contextName}</span>
          </If>
        </div>
      </Loading>
    </Dialog>
  );
};

export default RunPipeline;
