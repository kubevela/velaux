import React from 'react';
import { connect } from 'dva';

type Props = {
  revisions: [];
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
class ApplicationRevisionList extends React.Component<Props, State> {
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

  componentDidMount() {
    this.getRevisionList();
  }

  getRevisionList = async () => {
    const { page, pageSize, query } = this.state;
    this.props.dispatch({
      type: 'application/listRevisions',
      payload: {
        query,
        page,
        pageSize,
      },
    });
  };

  render() {
    return <div></div>;
  }
}

export default ApplicationRevisionList;
