import React, { Component } from 'react';
import { Dialog } from '@b-design/ui';
import { ApplicationDetail } from '../../../../interface/application';
import Translation from '../../../../components/Translation';
type Props = {
  appPlanBase: ApplicationDetail;
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
        title={<Translation>Edit Environment</Translation>}
      ></Dialog>
    );
  }
}

export default EnvBindPlanDialog;
