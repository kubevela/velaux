import * as React from 'react';
const SvgTerraform = (props: any) => (
  <svg
    className="terraform_svg__icon"
    viewBox="0 0 1024 1024"
    xmlns="http://www.w3.org/2000/svg"
    width={32}
    height={32}
    {...props}
  >
    <defs>
      <style>
        {
          '@font-face{font-family:feedback-iconfont;src:url(//at.alicdn.com/t/font_1031158_u69w8yhxdu.woff2?t=1630033759944) format("woff2"),url(//at.alicdn.com/t/font_1031158_u69w8yhxdu.woff?t=1630033759944) format("woff"),url(//at.alicdn.com/t/font_1031158_u69w8yhxdu.ttf?t=1630033759944) format("truetype")}'
        }
      </style>
    </defs>
    <path
      d="m353.118 180.428 318.245 161.676v323.287L353.118 503.716zm353.117 161.643V665.36l318.374-161.675V180.396zM0 0v323.287l318.242 161.675V161.675zm353.118 862.324L671.363 1024V700.84L353.118 539.166z"
      fill="#623CE4"
    />
  </svg>
);
export default SvgTerraform;
