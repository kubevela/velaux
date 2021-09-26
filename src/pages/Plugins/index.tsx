import React from 'react';
import Title from '../../components/plugin-title/index';
import SelectSearch from '../../components/select-search/index';
import CardContend from '../../components/CardConten/index';
import Img from '../../assets/plugins.png';


function Plugins() {
  return (
    <div>
      <Title />
      <SelectSearch />
      <CardContend cardImg={Img} />
    </div>
  );
}

export { Plugins };
