import React from 'react';
import { connect } from 'dva';
import Title from './components/clust-title/index';
import SelectSearch from './components/clust-select-search/index';
import CardContend from '../../components/CardConten/index';
import Img from '../../assets/clust-cloud.png';

type Props = {
  dispatch: ({ }) => {},
  applicationList: [],
  defaultCluster: string
};

type State = {

};

@connect((store: any) => {
  const list = [...store.application.applicationList];
  return { ...store.clusters, ...{ applicationList: list } }
})
class Clust extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
  }

  render() {
    const { applicationList } = this.props;
    return (
      <>
        <div>
          <Title />
          <SelectSearch />
          <CardContend
            cardImg={Img}
            appContent={applicationList}
          />
        </div>
      </>
    );
  }
}

export default Clust;
