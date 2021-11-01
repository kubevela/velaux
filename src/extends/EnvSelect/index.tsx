import React from 'react';

type Props = {
  clusterName: string;
};

type State = {};

class EnvSelect extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      dataSource: [],
    };
  }

  componentDidMount = async () => {};

  render() {
    return <div className="env-container"></div>;
  }
}

export default EnvSelect;
