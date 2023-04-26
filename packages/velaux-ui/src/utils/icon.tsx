import React from 'react';
type validSetter = (valid: boolean) => void

export const checkImage = (icon: string, setValid: validSetter) => {
  if (icon !== 'none' && icon !== '') {
    const img = new Image();
    img.src = icon;
    img.onload = () => {
      setValid(true)
    }
    img.onerror = () => {
      setValid(false)
    }
  } else {
    setValid(false)
  }
};

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

export const renderIcon = (name: string,  valid: boolean,icon?: string,) => {
  if (valid) {
    return <img src={icon} />;
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
