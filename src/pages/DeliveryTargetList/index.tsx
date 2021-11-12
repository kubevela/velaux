import React from 'react';
import { connect } from 'dva';
import ApplicationLayout from '../../layout/Application';
import ListTitle from '../../components/ListTitle';

type Props = {
  targetList: [];
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
  return { ...store.deliveryTarget };
})
class DeliveryTargetList extends React.Component<Props, State> {
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
    this.getDeliveryTargetList();
  }

  getDeliveryTargetList = async () => {
    const { page, pageSize, query } = this.state;
    this.props.dispatch({
      type: 'deliveryTarget/listDeliveryTarget',
      payload: {
        query,
        page,
        pageSize,
      },
    });
  };

  render() {
    return (
      <div>
        <ListTitle title="Delivery Target Manager" subTitle=""></ListTitle>
      </div>
    );
  }
}

export default DeliveryTargetList;
