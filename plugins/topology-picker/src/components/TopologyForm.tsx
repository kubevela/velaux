import * as React from 'react';
import { DefinitionFormProps } from '@velaux/data';
import { Checkbox, Input, Loading, Message, getBackendSrv } from '@velaux/ui';

type Cluster = {
  name: string;
  alias?: string;
  labels?: Record<string, string>;
  status?: string;
};

type TopologyProperties = {
  clusters?: string[];
  namespace?: string;
  [key: string]: any;
};

type State = {
  clusters: Cluster[];
  loading: boolean;
  error?: string;
};

// validateTopology blocks saving until at least one cluster is picked.
export function validateTopology(value?: TopologyProperties): string | undefined {
  if (!value || !value.clusters || value.clusters.length === 0) {
    return 'Pick at least one cluster';
  }
  return undefined;
}

// TopologyForm lists the clusters VelaUX knows about as checkboxes and writes
// the picked names to `clusters`. Every other property is kept as it is.
export class TopologyForm extends React.Component<DefinitionFormProps<TopologyProperties>, State> {
  state: State = { clusters: [], loading: true };

  componentDidMount() {
    getBackendSrv()
      .get('/api/v1/clusters', { params: { pageSize: 100 } })
      .then((res: any) => this.setState({ clusters: (res && res.clusters) || [], loading: false }))
      .catch((err: any) => this.setState({ loading: false, error: String(err?.message || err) }));
  }

  update = (change: Partial<TopologyProperties>) => {
    this.props.onChange({ ...(this.props.value || {}), ...change });
  };

  toggle = (name: string, checked: boolean) => {
    const picked = new Set(this.props.value?.clusters || []);
    if (checked) {
      picked.add(name);
    } else {
      picked.delete(name);
    }
    this.update({ clusters: this.state.clusters.map((c) => c.name).filter((n) => picked.has(n)) });
  };

  render() {
    const { clusters, loading, error } = this.state;
    const picked = new Set(this.props.value?.clusters || []);
    return (
      <Loading visible={loading} style={{ width: '100%' }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <div>Pick clusters</div>
          {error && <Message type="error">Could not list clusters: {error}</Message>}
          {clusters.map((c) => (
            <label
              key={c.name}
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                padding: '6px 8px',
                border: '1px solid var(--grey-200, #e6e6e6)',
                borderRadius: 4,
              }}
            >
              <Checkbox checked={picked.has(c.name)} onChange={(checked: boolean) => this.toggle(c.name, checked)} />
              <span style={{ fontWeight: 600 }}>{c.alias || c.name}</span>
              <span style={{ opacity: 0.7, fontSize: 12 }}>
                {Object.entries(c.labels || {})
                  .map(([k, v]) => `${k}=${v}`)
                  .join('  ')}
              </span>
            </label>
          ))}
          <div>Namespace</div>
          <Input
            value={this.props.value?.namespace || ''}
            placeholder="The application's namespace when empty"
            onChange={(v: string) => this.update({ namespace: v || undefined })}
          />
        </div>
      </Loading>
    );
  }
}
