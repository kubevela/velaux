import React, { Component } from 'react';
import { Button, Card, Step } from '@b-design/ui';
import { Link } from 'dva/router';
import { If } from 'tsx-control-statements/components';
import { VIEW_DETAILS, DEPLOYMENT_PLANS, NOT_YEW_PLEASE_GO_AND_CREATE } from '../../constants';

type Props = {
  appName: string;
  workflowStatus: [];
  history: {
    push: (path: string, state: {}) => {};
  };
};

type State = {};

class StepWorkFlow extends Component<Props, State> {
  handleClick = () => {
    const { appName } = this.props;
    this.props.history.push(`/workflowplans/${appName}`, {});
  };

  render() {
    const steps = ['step1', 'step2', 'step3', 'step4', 'step5'].map((item, index) => (
      <Step.Item key={index} title={item} />
    ));
    const { appName, workflowStatus = [] } = this.props;
    return (
      <React.Fragment>
        <Card className="margin-left-20">
          <div className="step-wraper text-align-center">
            <div className="nav">
              <div className="title"> {DEPLOYMENT_PLANS}</div>
              <div className="detail">
                <If condition={workflowStatus.length !== 0}>
                  <Link to={`/workflows/${appName}`}> {VIEW_DETAILS} </Link>
                </If>
              </div>
            </div>
            <If condition={workflowStatus.length === 0}>
              <Button component="a" text onClick={this.handleClick}>
                {NOT_YEW_PLEASE_GO_AND_CREATE}
              </Button>
            </If>
            <If condition={workflowStatus.length !== 0}>
              <Step current={1} shape="circle">
                {steps}
              </Step>
            </If>
          </div>
        </Card>
      </React.Fragment>
    );
  }
}

export default StepWorkFlow;
