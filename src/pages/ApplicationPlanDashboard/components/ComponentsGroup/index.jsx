import React from 'react';
import PropTypes from 'prop-types';
import { DragSource } from 'react-dnd';
import { Button, Balloon } from '@b-design/ui';

const style = {
  border: '1px dashed gray',
  backgroundColor: 'white',
  marginRight: '16px',
  cursor: 'move',
  float: 'left',
};

const boxSource = {
  beginDrag(props) {
    return {
      name: props.name,
    };
  },

  endDrag(props, monitor) {
    const item = monitor.getItem();
    const dropResult = monitor.getDropResult();
    if (dropResult) {
      props.open && props.open(item.name);
    }
  },
};

@DragSource('box', boxSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging(),
}))
class Box extends React.Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    isDragging: PropTypes.bool.isRequired,
    connectDragSource: PropTypes.func.isRequired,
  };

  render() {
    const { isDragging, connectDragSource } = this.props;
    const { name, description } = this.props;
    const opacity = isDragging ? 0.4 : 1;
    const defaultTrigger = (
      <Button
        onClick={() => {
          this.props.open(name);
        }}
        className="btrigger"
        style={{ margin: '5px' }}
      >
        {name}
      </Button>
    );
    return (
      connectDragSource &&
      connectDragSource(
        <div style={{ ...style, opacity }}>
          <Balloon trigger={defaultTrigger} closable={false} align="t">
            {description}
          </Balloon>
        </div>,
      )
    );
  }
}

export default Box;
