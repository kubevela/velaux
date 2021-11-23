import React from 'react';

type Props = {
  clusterName: string;
  namespace: string;
};

type State = {};

class PVCSelect extends React.Component<Props, State> {
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

export default PVCSelect;
