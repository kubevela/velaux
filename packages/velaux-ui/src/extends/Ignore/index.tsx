import React from 'react';

type Props = {
  url: string;
};

type State = {};

class Ignore extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      dataSource: [],
    };
  }

  componentDidMount = async () => {};

  render() {
    return <div />;
  }
}

export default Ignore;
