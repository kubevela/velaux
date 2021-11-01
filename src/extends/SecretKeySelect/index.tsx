import React from 'react';

type DataSource = Array<{ label: string; value: any }>;

type Props = {
  secretKeys: string;
};

type State = {};

class SecretKeySelect extends React.Component<Props, State> {
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

export default SecretKeySelect;
