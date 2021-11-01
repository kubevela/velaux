import React from 'react';

type DataSource = Array<{ label: string; value: any }>;

type Props = {
  appName: string;
};

type State = {};

class ComponentSelect extends React.Component<Props, State> {
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

export default ComponentSelect;
