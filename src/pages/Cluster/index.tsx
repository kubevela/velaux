import React from 'react';
import { connect } from 'dva';
import Title from '../../components/List-title';
import SelectSearch from './components/clust-select-search/index';
import CardContend from './components/card-conten/index';
import { CLUSTERS_PATH, WORKFLOWS_PATH } from '../../utils/common';
import Img from '../../assets/clust-cloud.png';

type Props = {
  dispatch: ({}) => {};
  applicationList: [];
  defaultCluster: string;
};

type State = {};

@connect((store: any) => {
  const list = [...store.application.applicationList];
  return { ...store.clusters, ...{ applicationList: list } };
})
class Cluster extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
  }

  render() {
    const { applicationList } = this.props;
    return (
      <>
        <div>
          <Title
            title="Cluster management"
            subTitle="Introduction to cluster management"
            btnName="Add cluster"
            dialogName={CLUSTERS_PATH}
          />
          <SelectSearch />
          <CardContend
            cardImg={Img}
            appContent={applicationList}
            path={CLUSTERS_PATH}
            workFlowPath={WORKFLOWS_PATH}
          />
        </div>
      </>
    );
  }
}

export default Cluster;
