import {Tag, Timeline} from 'antd';

export default (props: any) => {
  const item = props.event
  let tagColor;
  if (item.type === "Normal"){
    tagColor = "green"
  }else if (item.type === "Warning"){
    tagColor = "orange"
  }else {
    tagColor = "red"
  }
  return (
    <Timeline.Item color={tagColor}>
      <Tag color={tagColor}>{item.type}</Tag>
      <Tag color="blue">{item.reason}</Tag> <a>{item.age}</a> <span>{item.message}</span>
    </Timeline.Item>
  )
}
