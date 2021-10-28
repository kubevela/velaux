import React from 'react';
import { connect } from 'dva';
import Title from '../../components/ListTitle';
import SelectSearch from './components/ClustSelectSearch';
import CardContend from './components/CardContent/index';
import { CLUSTERS_PATH, WORKFLOWS_PATH } from '../../utils/common';
import Img from '../../assets/clust-cloud.png';

type Props = {
  clusterList: [];
  defaultCluster: string;
  cloudClusters: [];
  dispatch: ({ }) => {};
};

type State = {
  page: number;
  pageSize: number;
  query: string;
};

@connect((store: any) => {
  const list = [...store.application.applicationList];
  return { ...store.clusters, ...{ applicationList: list } };
})
class Cluster extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      query: '',
      page: 0,
      pageSize: 10,
    };
  }

  componentDidMount() {
    this.getClusterList();
  }

  getClusterList = async () => {
    const { page, pageSize, query } = this.state;
    this.props.dispatch({
      type: 'clusters/getClusterList',
      payload: {
        query,
        page,
        pageSize,
      },
    });
  };

  getChildCompentQuery = (query: string) => {
    this.setState(
      {
        query,
      },
      () => {
        this.getClusterList();
      },
    );
  };
  render() {
    const { clusterList = [], cloudClusters = [], dispatch } = this.props;
    const { page, pageSize, query } = this.state;
    return (
      <>
        <div>
          <Title
            title="Cluster management"
            subTitle="Introduction to cluster management"
            btnName="Add cluster"
            btnSubName="Add from cloud service"
            page={page}
            pageSize={pageSize}
            query={query}
            dialogName={CLUSTERS_PATH}
            cloudClusters={cloudClusters}
            dispatch={dispatch}
          />
          <SelectSearch
            dispatch={dispatch}
            getChildCompentQuery={(query: string): any => {
              this.getChildCompentQuery(query);
            }}
          />
          <CardContend
            cardImg={Img}
            appContent={clusterList}
            path={CLUSTERS_PATH}
            workFlowPath={WORKFLOWS_PATH}
          />
        </div>
      </>
    );
  }
}

export default Cluster;
