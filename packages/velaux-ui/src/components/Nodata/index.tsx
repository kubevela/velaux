import React from 'react';

import Img from '../../assets/noData.png';

type Props = {
  width?: string;
  margin?: string;
  display?: string;
};
export default function NoData(props: Props) {
  const { width = '100%', margin = '0 auto', display = 'block' } = props;
  return (
    <div style={{ background: '#fff', width: '100%' }}>
      <img src={Img} style={{ width, margin, display }} alt="no data" />
    </div>
  );
}
