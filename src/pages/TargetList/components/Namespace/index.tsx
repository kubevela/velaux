import React from 'react';
import { Input, Select, Button, Message } from '@b-design/ui';
import { If } from 'tsx-control-statements/components';
import Translation from '../../../../components/Translation';
import { createClusterNamespace } from '../../../../api/cluster';
import locale from '../../../../utils/locale';

type Props = {
  cluster?: string;
  namespaces?: NamespaceItem[];
  onChange?: (namespace: string) => void;
  value?: any;
  loadNamespaces: (cluster: string) => void;
  disableNew?: boolean;
  disabled?: boolean;
};

export interface NamespaceItem {
  value: string;
  label: string;
}

type State = {
  showNameSpaceInput: boolean;
  inputNamespaceParam: string;
  loading: boolean;
  createNamespace?: string;
};

class Namespace extends React.Component<Props, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      showNameSpaceInput: false,
      inputNamespaceParam: '',
      loading: false,
    };
  }

  openNamespaceInput = () => {
    this.setState({
      showNameSpaceInput: true,
    });
  };

  closeNamespaceInput = () => {
    this.setState({
      showNameSpaceInput: false,
    });
  };

  createNamespace = () => {
    const { cluster, loadNamespaces } = this.props;
    if (!cluster) {
      Message.warning('Please select a cluster first');
      return;
    }
    const { createNamespace } = this.state;
    this.setState({ loading: true });
    if (cluster && createNamespace) {
      createClusterNamespace({ cluster: cluster, namespace: createNamespace }).then((re) => {
        if (re) {
          Message.success('create namespace success');
          loadNamespaces(cluster);
        }
        this.setState({
          loading: false,
          showNameSpaceInput: false,
        });
      });
    }
  };

  render() {
    const { disableNew, onChange, namespaces, value, disabled } = this.props;
    const { showNameSpaceInput, loading } = this.state;
    return (
      <div>
        <If condition={!showNameSpaceInput}>
          <div className="cluster-container">
            <Select
              locale={locale.Select}
              className="cluster-params-input"
              mode="single"
              disabled={disabled}
              dataSource={namespaces}
              onChange={onChange}
              placeholder={''}
              value={value}
            />
            <If condition={!disableNew}>
              <Button
                className="cluster-option-btn"
                type="secondary"
                disabled={disabled}
                onClick={this.openNamespaceInput}
              >
                <Translation>New</Translation>
              </Button>
            </If>
          </div>
        </If>
        <If condition={showNameSpaceInput}>
          <div className="cluster-container">
            <Input
              onChange={(v) => this.setState({ createNamespace: v })}
              className="cluster-params-input"
            />
            <Button
              loading={loading}
              className="cluster-option-btn"
              type="secondary"
              onClick={this.createNamespace}
            >
              <Translation>Submit</Translation>
            </Button>
          </div>
        </If>
      </div>
    );
  }
}

export default Namespace;
