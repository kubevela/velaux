import React, { Component } from 'react';
import { Dialog } from '@b-design/ui';
import { AppPlanDetail } from '../../../../interface/applicationplan';
import Translation from '../../../../components/Translation';
import EnvPlan from '../../../../extends/EnvPlan';
type Props = {
  appPlanBase: AppPlanDetail;
  onClose: () => void;
  onOK: () => void;
};

class EnvBindPlanDialog extends Component<Props> {
  onSubmit = () => {};
  render() {
    return (
      <Dialog
        visible={true}
        style={{ width: '1000px' }}
        footerActions={['ok']}
        onClose={this.props.onClose}
        onOk={this.onSubmit}
        title={<Translation>Add Environment</Translation>}
      >
        <EnvPlan envList={[]} clusterList={[]}></EnvPlan>
      </Dialog>
    );
  }
}

export default EnvBindPlanDialog;
