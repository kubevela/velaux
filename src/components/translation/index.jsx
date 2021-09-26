import React from "react";
import { useTranslation } from "react-i18next";

const Translation = ({ children, className = '' }) => {
  const { t } = useTranslation();
  return (
    <span className={className}>
      {t(children)}
    </span>
  );
};

export default Translation;
