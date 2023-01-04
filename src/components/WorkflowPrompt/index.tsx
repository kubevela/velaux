import type * as H from 'history';
import React, { useEffect } from 'react';
import { Prompt, routerRedux } from 'dva/router';
import { Dialog } from '@b-design/ui';
import locale from '../../utils/locale';
import type { Dispatch } from 'redux';

export interface Props {
  changed: boolean;
  title: string;
  content: React.ReactNode;
  dispatch?: Dispatch<any>;
  onSave: () => void;
  onClearChanged: () => void;
}

export const WorkflowPrompt = React.memo(
  ({ changed, content, onSave, dispatch, onClearChanged }: Props) => {
    useEffect(() => {
      const handleUnload = (event: BeforeUnloadEvent) => {
        if (changed) {
          event.preventDefault();
          // No browser actually displays this message anymore.
          // But Chrome requires it to be defined else the popup won't show.
          event.returnValue = '';
        }
      };
      window.addEventListener('beforeunload', handleUnload);
      return () => window.removeEventListener('beforeunload', handleUnload);
    }, [changed]);

    const onHistoryBlock = (location: H.Location) => {
      if (changed) {
        Dialog.confirm({
          content: content,
          locale: locale().Dialog,
          onOk: () => {
            onSave();
            onClearChanged();
            moveToBlockedLocationAfterReactStateUpdate(dispatch, location);
          },
          onCancel: () => {
            onClearChanged();
            moveToBlockedLocationAfterReactStateUpdate(dispatch, location);
          },
        });
        return false;
      }

      return false;
    };

    return <Prompt when={true} message={onHistoryBlock} />;
  },
);

WorkflowPrompt.displayName = 'WorkflowPrompt';

function moveToBlockedLocationAfterReactStateUpdate(
  dispatch?: Dispatch<any>,
  location?: H.Location | null,
) {
  if (location) {
    setTimeout(() => {
      if (dispatch) {
        dispatch(routerRedux.push(location));
      }
    }, 10);
  }
}
