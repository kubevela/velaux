import { Select } from '@alifd/next';
import React from 'react';

import { getClusterList } from '../../api/cluster';
import { getConfigs } from '../../api/config';
import { getEnvs } from '../../api/env';
import { locale } from '../../utils/locale';

type Props = {
  id?: string;
  value?: any;
  onChange?: (value: any) => void;
  disabled?: boolean;
  placeholder?: string;
  // source names where the choices come from: configs:<template>, clusters or
  // envs.
  source: string;
};

type State = {
  options: Array<{ label: string; value: string }>;
  loading: boolean;
};

type Named = { name: string; alias?: string };

// optionsSources are the sources an optionsFrom hint may name.
export const optionsSources = ['configs:', 'clusters', 'envs'];

export function isOptionsSource(source?: string): boolean {
  return !!source && optionsSources.some((s) => (s.endsWith(':') ? source.startsWith(s) : source === s));
}

// OptionsFromSelect offers the names of existing objects, read when the form
// opens, as the choices for a parameter.
class OptionsFromSelect extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { options: [], loading: true };
  }

  componentDidMount() {
    this.load();
  }

  load = async () => {
    const { source } = this.props;
    let items: Named[] = [];
    try {
      if (source.startsWith('configs:')) {
        const res: any = await getConfigs(source.substring('configs:'.length));
        items = res?.configs || [];
      } else if (source === 'clusters') {
        const res: any = await getClusterList({});
        items = res?.clusters || [];
      } else if (source === 'envs') {
        const res: any = await getEnvs({});
        items = res?.envs || [];
      }
    } finally {
      this.setState({
        options: items.map((i) => ({ label: i.alias || i.name, value: i.name })),
        loading: false,
      });
    }
  };

  render() {
    const { id, value, onChange, disabled, placeholder } = this.props;
    const { options, loading } = this.state;
    return (
      <Select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        locale={locale().Select}
        dataSource={options}
        state={loading ? 'loading' : undefined}
        showSearch
        hasClear
        style={{ width: '100%' }}
      />
    );
  }
}

export default OptionsFromSelect;
