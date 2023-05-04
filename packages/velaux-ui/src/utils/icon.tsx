import React from 'react';

const nameUpper = (name: string) => {
  return name
    .split('-')
    .map((sep) => {
      if (sep.length > 0) {
        return sep.toUpperCase()[0];
      }
      return sep;
    })
    .toString()
    .replace(',', '');
};

export const renderIcon = (name: string, icon?: string, size?: string) => {
  console.log(icon)
  if (icon!==""  && icon!=="null" && icon!==undefined) {
    if (!icon.startsWith("/")){
      icon = "/"+icon
    }
    return <img style={{width: size??"60px", height: size??"60px" }} src={icon} />;
  } else {
    return (
      <div
        style={{
          display: 'inline-block',
          verticalAlign: 'middle',
          padding: `2px 4px`,
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#fff',
          textAlign: 'center',
          lineHeight: '60px',
        }}
      >
        <span style={{ color: '#1b58f4', fontSize: `2em` }}>{nameUpper(name)}</span>
      </div>
    );
  }
}
