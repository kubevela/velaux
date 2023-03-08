import React from 'react';

type Props = {
  clusterName: string;
};

type State = {};

class ClassStorageSelect extends React.Component<Props, State> {
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

export default ClassStorageSelect;
