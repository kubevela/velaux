import { Button } from '@b-design/ui';
import React from 'react';

import Translation from '../Translation';
import './index.less';
import { If } from '../If';
type Props = {
  title: string;
  subTitle?: string;
  extButtons?: [React.ReactNode];
  addButtonTitle?: string;
  addButtonClick?: () => void;
  buttonSize?: 'small' | 'medium' | 'large';
};
const ListTitle = function (props: Props) {
  const { title, subTitle, extButtons, addButtonTitle, addButtonClick, buttonSize } = props;

  return (
    <div className="title-wrapper">
      <div>
        <span className="title font-size-20">
          <Translation>{title}</Translation>
        </span>

        {subTitle && (
          <span className="subTitle font-size-14">
            <Translation>{subTitle}</Translation>
          </span>
        )}
      </div>

      <div className="float-right">
        {extButtons &&
          extButtons.map((item) => {
            return item;
          })}
        <If condition={addButtonTitle}>
          <Button size={buttonSize ? buttonSize : 'medium'} type="primary" onClick={addButtonClick}>
            <Translation>{addButtonTitle ? addButtonTitle : ''}</Translation>
          </Button>
        </If>
      </div>
    </div>
  );
};

export default ListTitle;
