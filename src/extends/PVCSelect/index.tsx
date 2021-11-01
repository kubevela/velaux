import React from 'react';

type DataSource = Array<{ label: string; value: any }>;

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
    return <div></div>;
  }
}

export default PVCSelect;
