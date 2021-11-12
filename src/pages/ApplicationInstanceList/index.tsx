import React from 'react';
import { connect } from 'dva';
import ApplicationLayout from '../../layout/Application';

type Props = {
  dispatch: ({}) => {};
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
class ApplicationInstanceList extends React.Component<Props, State> {
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
    return <ApplicationLayout {...this.props}></ApplicationLayout>;
  }
}

export default ApplicationInstanceList;
