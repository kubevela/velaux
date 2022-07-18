import { Select } from '@b-design/ui';
import { connect } from 'dva';
import React from 'react';
import { getApplicationComponents } from '../../api/application';
import i18n from '../../i18n';
import type { ApplicationComponentBase } from '../../interface/application';
import locale from '../../utils/locale';

type Props = {
  value: string[];
  id: string;
  onChange: (value: string[]) => void;
  disabled: boolean;
  appName?: string;
};

type State = {
  componentOptions: { label: string; value: string }[];
};

@connect((store: any) => {
  return { ...store.uischema };
})
class ComponentSelect extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      componentOptions: [],
    };
  }

  componentDidMount = () => {
    this.fetchComponentList();
  };

  fetchComponentList = async () => {
    const { appName } = this.props;
    if (appName) {
      getApplicationComponents({
        appName: appName,
      })
        .then((res) => {
          if (res && res.components) {
            const componentOptions = (res.components || []).map(
              (item: ApplicationComponentBase) => {
                return {
                  label: `${item.name}(${item.alias || '-'})`,
                  value: item.name,
                };
              },
            );
            this.setState({
              componentOptions: componentOptions,
            });
          } else {
            this.setState({
              componentOptions: [],
            });
          }
        })
        .catch(() => {
          this.setState({
            componentOptions: [],
          });
        });
    }
  };

  onChange = (value: string[]) => {
    const { onChange } = this.props;
    onChange(value);
  };

  render() {
    const { value, id, disabled } = this.props;
    const { componentOptions } = this.state;

    return (
      <Select
        placeholder={i18n.t('Please select the components')}
        onChange={this.onChange}
        id={id}
        disabled={disabled}
        defaultValue={value || []}
        value={value || []}
        dataSource={componentOptions}
        mode="multiple"
        locale={locale().Select}
      />
    );
  }
}

export default ComponentSelect;
