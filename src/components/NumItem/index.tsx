import React from 'react';
import './index.less';

export type Props = {
  title: string | React.ReactNode;
  number?: number;
};

const NumItem: React.FC<Props> = (props) => {
  return (
    <div className="num-item">
      <div className="number">{props.number || 0}</div>
      <div className="title">{props.title}</div>
    </div>
  );
};

export default NumItem;
