import React from 'react';
import Title from '../../components/app-manager-title/index';
import SelectSearch from '../../components/select-search/index';
import CardContend from '../../components/CardConten/index';

function Application() {
  return (
    <div>
      <Title />
      <SelectSearch />
      <CardContend />
    </div>
  );
}

export { Application };
