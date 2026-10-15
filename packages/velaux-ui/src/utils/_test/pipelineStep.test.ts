import { expect } from 'chai';

import { stepCaption, stepReached, stepStatus } from '../../components/PipelineGraph/status';

const at = (s: number) => new Date(Date.UTC(2026, 9, 3, 13, 0, s)).toISOString();

describe('stepStatus', () => {
  it('reads a step the run has not reached as not started', () => {
    expect(stepStatus({})).to.deep.equal({ tone: 'neutral', label: 'Not started' });
  });
  it('reads a reached step as its run phase', () => {
    expect(stepStatus({ phase: 'suspending' }).label).to.equal('Waiting for approval');
    expect(stepStatus({ phase: 'stopped' }).tone).to.equal('failed');
  });
});

describe('stepReached', () => {
  it('is true once a step has a phase other than pending', () => {
    expect(stepReached({ phase: 'succeeded' })).to.equal(true);
    expect(stepReached({ phase: 'suspending' })).to.equal(true);
    expect(stepReached({ phase: 'pending' })).to.equal(false);
    expect(stepReached({})).to.equal(false);
  });
});

describe('stepCaption', () => {
  const time = (iso: string) => iso.slice(11, 19);
  it('gives a finished step its duration and start', () => {
    expect(stepCaption({ phase: 'succeeded', firstExecuteTime: at(0), lastExecuteTime: at(44) }, time)).to.deep.equal({
      text: '44s · 13:00:00',
      error: false,
    });
  });
  it('gives a failed step its message, else its reason', () => {
    expect(stepCaption({ phase: 'failed', message: 'timeout', reason: 'Timeout' }, time)).to.deep.equal({
      text: 'timeout',
      error: true,
    });
    expect(stepCaption({ phase: 'stopped', reason: 'Terminate' }, time)).to.deep.equal({
      text: 'Terminate',
      error: true,
    });
  });
  it('gives a waiting or running step the time it started', () => {
    expect(stepCaption({ phase: 'suspending', firstExecuteTime: at(5) }, time).text).to.equal('since 13:00:05');
    expect(stepCaption({ phase: 'running', firstExecuteTime: at(5) }, time).text).to.equal('since 13:00:05');
  });
  it('gives a step the run has not reached no caption', () => {
    expect(stepCaption({}, time)).to.deep.equal({ text: '', error: false });
  });
});
