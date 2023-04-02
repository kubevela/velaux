import type { SelectProps } from '@alifd/next/lib/select';
import { Select } from '@alifd/next';
import * as React from 'react';

import { locale } from '../../utils/locale';

interface CustomSelectProps extends SelectProps {
  enableInput?: boolean;
  dataSource?: Array<{ label?: string; value: any }>;
}

export const CustomSelect = (props: CustomSelectProps) => {
  const [inputValue, setInputValue] = React.useState('');
  const dataSource = [...(props.dataSource || [])];
  if (inputValue != '') {
    dataSource.unshift({ label: inputValue, value: inputValue });
  }
  return (
    <Select
      {...props}
      locale={locale().Select}
      showSearch={true}
      onSearch={(value) => {
        if (props.enableInput) {
          setInputValue(value);
        }
        if (props.onSearch) {
          props.onSearch(value);
        }
      }}
      dataSource={dataSource}
    >
      {props.children}
    </Select>
  );
};
