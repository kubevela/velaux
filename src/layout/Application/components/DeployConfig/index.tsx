import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import { Dialog, Radio } from '@b-design/ui';
import type { Workflow } from '../../../../interface/application';
import Translation from '../../../../components/Translation';
import locale from '../../../../utils/locale';
import './index.less';

const { Group: RadioGroup } = Radio;

interface Props {
  onClose: () => void;
  onOK: (workflowName?: string, force?: boolean) => void;
  workflows?: Workflow[];
}

interface State {
  loading: boolean;
  workflowName: string;
}

class DeployConfigDialog extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      workflowName: '',
    };
  }

  componentDidMount() {
    const { workflows } = this.props;
    workflows?.map((w) => {
      if (w.default) {
        this.setState({ workflowName: w.name });
      }
    });
  }

  onSubmit = () => {
    if (this.state.workflowName) {
      this.props.onOK(this.state.workflowName);
      this.props.onClose();
    }
  };

  onChange = (name: any) => {
    this.setState({ workflowName: name });
  };
  render() {
    const { workflows, onClose } = this.props;
    const { workflowName } = this.state;
    return (
      <React.Fragment>
        <Dialog
          visible={true}
          locale={locale.Dialog}
          className={'commonDialog deployConfig'}
          style={{ width: '600px' }}
          isFullScreen={true}
          footerActions={['cancel', 'ok']}
          onClose={onClose}
          onCancel={onClose}
          onOk={this.onSubmit}
          title={<Translation>Select Workflow</Translation>}
        >
          <RadioGroup value={workflowName} onChange={this.onChange}>
            {workflows?.map((workflow) => {
              return (
                <Radio
                  id={workflow.name}
                  value={workflow.name}
                  onClick={() => {
                    this.onChange(workflow.name);
                  }}
                >
                  {workflow.alias ? workflow.alias : workflow.name}
                  <span className="env">Env: {workflow.envName}</span>
                </Radio>
              );
            })}
          </RadioGroup>
        </Dialog>
      </React.Fragment>
    );
  }
}

export default withTranslation()(DeployConfigDialog);
