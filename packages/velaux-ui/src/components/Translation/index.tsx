import React from 'react';
import { useTranslation } from 'react-i18next';

export type Props = {
  children: string;
  className?: string | undefined;
};

export const Translation = (props: Props) => {
  const { t } = useTranslation();
  const { children, className = '' } = props;
  return <span className={className}>{t(children)}</span>;
};
