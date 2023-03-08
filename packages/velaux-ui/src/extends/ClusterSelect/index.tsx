import React from 'react';

type Props = {
  url: string;
};

type State = {};

class ClusterSelect extends React.Component<Props, State> {
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

export default ClusterSelect;
