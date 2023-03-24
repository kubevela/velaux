import React from 'react';
import { Link } from 'dva/router';
import './index.less';

export type Props = {
  title: string | React.ReactNode;
  number?: number;
  to?: string;
};

const NumItem: React.FC<Props> = (props) => {
  return (
    <div className="num-item">
      <div className="number">
        {props.to ? <Link to={props.to}>{props.number || 0}</Link> : <span>{props.number || 0}</span>}
      </div>
      <div className="title">{props.title}</div>
    </div>
  );
};

export default NumItem;
