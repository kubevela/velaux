import React from 'react';
import { useTranslation } from 'react-i18next';

type Props = {
  children: string;
  className?: string | undefined;
}


const Translation = (props: Props) => {
  const { t } = useTranslation();
  const { children, className = '' } = props;
  return <span className={className}>{t(children)}</span>;
};

export default Translation;
