import * as React from 'react';
import { Dialog } from '@b-design/ui';
import type { ApplicationCompareResponse } from '../../interface/application';
const Convert = require('ansi-to-html');
const convert = new Convert();
import './index.less';

type ApplicationDiffProps = {
  baseName: string;
  targetName: string;
  compare: ApplicationCompareResponse;
  onClose: () => void;
};

export const ApplicationDiff = (props: ApplicationDiffProps) => {
  const lines = props.compare.diffReport.split('\n');
  const parseToDOM = (str: string, padding: number) => {
    return (
      <div
        style={{ paddingLeft: `${padding}px`, fontSize: '14px' }}
        dangerouslySetInnerHTML={{ __html: str }}
      />
    );
  };
  return (
    <Dialog
      className={'commonDialog application-diff'}
      isFullScreen={true}
      footer={<div />}
      visible={true}
      onClose={props.onClose}
      title={
        <div style={{ color: '#fff' }}>
          {' Differences between '}
          <span className="name base">{props.baseName}</span>
          {' and '}
          <span className="name target">{props.targetName}</span>
        </div>
      }
    >
      <div className="diff-box">
        {lines.map((line) => {
          let parsed: string = line.replaceAll(' ', '&nbsp;');
          parsed = convert.toHtml(parsed);
          return parseToDOM(parsed.trimStart(), 0);
        })}
      </div>
    </Dialog>
  );
};
