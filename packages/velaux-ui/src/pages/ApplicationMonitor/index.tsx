import { connect } from 'dva';
import React from 'react';

type Props = {
  dispatch: ({}) => {};
  match: any;
};

type State = {
  page: number;
  pageSize: number;
  query: string;
  showAddTarget: boolean;
  editTargetName: string;
};

@connect((store: any) => {
  return { ...store.application };
})
class ApplicationMonitor extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      query: '',
      page: 0,
      pageSize: 10,
      showAddTarget: false,
      editTargetName: '',
    };
  }

  componentDidMount() {}

  render() {
    return <div />;
  }
}

export default ApplicationMonitor;
