import { Link } from 'dva/router';
import * as React from 'react';
import { Breadcrumb as B } from '@alifd/next';
import { AiOutlineHome } from 'react-icons/ai';

interface Props {
  items: { to?: string; title: JSX.Element | string }[];
}
export const Breadcrumb = (props: Props) => {
  return (
    <div className="breadcrumb">
      <Link to={'/'}>
        <AiOutlineHome size={18} />
      </Link>
      <B separator="/">
        {props.items.map((item, i) => {
          return (
            <B.Item key={'breadcrumb' + i}>
              {item.to && <Link to={item.to}>{item.title}</Link>}
              {!item.to && item.title}
            </B.Item>
          );
        })}
      </B>
    </div>
  );
};
