import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'dva';
import ListTitle from '../../components/ListTitle';
import TableList from './components/List';
import DeliveryDialog from './components/DeliveryDialog';

type Props = {
  deliveryTargets?: [];
  total?: number;
  clusterList?: [];
  namespaceList?: [];
  dispatch: ({}) => {};
  t: (key: string) => {};
};

type State = {
  page: number;
  pageSize: number;
  query: string;
  showAddTarget: boolean;
  editTargetName: string;
  visibleDelivery: boolean;
  isEdit: boolean;
};

@connect((store: any) => {
  return { ...store.deliveryTarget, ...store.application, ...store.clusters };
})
class DeliveryTargetList extends React.Component<Props, State> {
  deliveryDialogRef: React.RefObject<DeliveryDialog>;
  constructor(props: Props) {
    super(props);
    this.state = {
      query: '',
      page: 0,
      pageSize: 10,
      showAddTarget: false,
      editTargetName: '',
      visibleDelivery: false,
      isEdit: false,
    };
    this.deliveryDialogRef = React.createRef();
  }

  componentDidMount() {
    this.getDeliveryTargetList();
    this.getClusterList();
    this.getNamespaceList();
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

  getClusterList = async () => {
    this.props.dispatch({
      type: 'clusters/getClusterList',
    });
  };

  getNamespaceList = async () => {
    this.props.dispatch({
      type: 'application/getNamespaceList',
      payload: {},
    });
  };

  updateDeliveryTargetList = () => {
    this.setState(
      {
        query: '',
        page: 0,
        pageSize: 10,
      },
      () => {
        this.getDeliveryTargetList();
      },
    );
  };

  changeISEdit = (isEdit: boolean, record: any) => {
    this.setState({
      isEdit,
      visibleDelivery: true,
    });
    const { name, alias, description, namespace, kubernetes, cloud } = record;
    this.deliveryDialogRef.current?.field.setValues({
      name,
      alias,
      description,
      project: namespace,
      clusterName: kubernetes.clusterName,
      namespace: kubernetes.namespace,
      providerName: cloud.providerName,
      region: cloud.region,
      zone: cloud.zone,
      vpcID: cloud.vpcID,
    });
  };

  onClose = () => {
    this.setState({ visibleDelivery: false, isEdit: false });
  };

  onOk = () => {
    this.getDeliveryTargetList();
    this.setState({
      isEdit: false,
    });
  };

  render() {
    const { t, clusterList, deliveryTargets, total, namespaceList, dispatch } = this.props;
    const { visibleDelivery, isEdit } = this.state;

    return (
      <div>
        <ListTitle
          title="Delivery Target Manager"
          subTitle="Define the delivery target for an application"
          addButtonTitle="Add DeliveryTarget"
          addButtonClick={() => {
            this.setState({ visibleDelivery: true });
          }}
        />

        <TableList
          list={deliveryTargets}
          updateDeliveryTargetList={this.updateDeliveryTargetList}
          changeISEdit={(isEdit: boolean, record: any) => {
            this.changeISEdit(isEdit, record);
          }}
        />

        <DeliveryDialog
          t={t}
          visible={visibleDelivery}
          clusterList={clusterList}
          namespaceList={namespaceList}
          isEdit={isEdit}
          onClose={this.onClose}
          onOK={this.onOk}
          dispatch={dispatch}
          ref={this.deliveryDialogRef}
        />
      </div>
    );
  }
}

export default withTranslation()(DeliveryTargetList);
