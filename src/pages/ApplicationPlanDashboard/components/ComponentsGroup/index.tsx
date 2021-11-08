import React from 'react';
import PropTypes from 'prop-types';
import { Button, Balloon } from '@b-design/ui';

type Props = {
  name: any;
  description?: any;
  open: (componentType: string) => void;
};

class Box extends React.Component<Props> {
  render() {
    const { name, description } = this.props;
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
      <div
        style={{
          border: '1px dashed gray',
          backgroundColor: 'white',
          marginRight: '16px',
          cursor: 'move',
          float: 'left',
        }}
      >
        <Balloon trigger={defaultTrigger} closable={false} align="t">
          {description}
        </Balloon>
      </div>
    );
  }
}

export default Box;
