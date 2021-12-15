import React from 'react';
import { Dialog, Loading, Button } from '@b-design/ui';
import { connect } from 'dva';
import type { ApplicationStatus } from '../../../../interface/application';
import Translation from '../../../../components/Translation';
import locale from '../../../../utils/locale';
import Status from '../Status';

type Props = {
  applicationStatus?: ApplicationStatus;
  onClose: () => void;
  dispatch: ({}) => void;
  appName: string;
  envName: string;
};

type State = {
  loading: boolean;
};

@connect((store: any) => {
  return { ...store.application };
})
class StatusShow extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
    };
  }
  componentDidMount = async () => {
    this.loadApplicationStatus();
  };

  loadApplicationStatus = async () => {
    const { appName, envName } = this.props;
    if (envName) {
      this.setState({ loading: true });
      this.props.dispatch({
        type: 'application/getApplicationStatus',
        payload: { appName: appName, envName: envName },
        callback: () => {
          this.setState({ loading: false });
        },
      });
    }
  };

  render() {
    const { applicationStatus, onClose } = this.props;
    const { loading } = this.state;

    return (
      <Dialog
        locale={locale.Dialog}
        visible={true}
        className={'commonDialog'}
        title={<Translation>Application Status</Translation>}
        autoFocus={true}
        isFullScreen={true}
        style={{ width: '800px' }}
        onClose={onClose}
        footer={
          <div className="next-dialog-footer">
            <Button onClick={onClose}>
              <Translation>Close</Translation>
            </Button>
            <Button type="primary" onClick={this.loadApplicationStatus}>
              <Translation>Refresh</Translation>
            </Button>
          </div>
        }
        height="auto"
        footerAlign="center"
      >
        <Loading visible={loading} style={{ width: '100%' }}>
          <Status applicationStatus={applicationStatus} />
        </Loading>
      </Dialog>
    );
  }
}

export default StatusShow;
