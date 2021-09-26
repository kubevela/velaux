import React, { useState } from "react";
import "./index.less";
import { Button } from "@alifd/next";
import { useTranslation } from "react-i18next";
import { publish } from "tiny-pubsub";
import { getLanguage } from "../../utils/common";

const SwitchLanguage = () => {
  let { i18n } = useTranslation();
  const _isEnglish = getLanguage() === "en";
  const [isEnglish, setIsEnglish] = useState(_isEnglish);
  return (
    <div className="login-button-style">
      <Button
        className={`english-part ${isEnglish ? "is-english" : null}`}
        onClick={() => {
          i18n.changeLanguage("en");
          localStorage.setItem("lang", "en");
          publish("language-change", "en");
          setIsEnglish(true);
        }}
      >
        EN
      </Button>
      <Button
        className={`chinese-part ${isEnglish ? "null" : "is-english"}`}
        onClick={() => {
          i18n.changeLanguage("zh");
          localStorage.setItem("lang", "zh");
          publish("language-change", "zh");
          setIsEnglish(false);
        }}
      >
        中
      </Button>
    </div>
  );
};
export default SwitchLanguage;
