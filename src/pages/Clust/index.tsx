import React from 'react';
import Title from './components/clust-title/index';
import SelectSearch from './components/clust-select-search/index';
import CardContend from '../../components/CardConten/index';
import Img from '../../assets/clust-cloud.png';

class Clust extends React.Component {
  render() {
    return (
      <>
        <div>
          <Title />
          <SelectSearch />
          <CardContend cardImg={Img} />
        </div>
      </>
    );
  }
}

export default Clust;
