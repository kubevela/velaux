import React from 'react';
import { connect } from 'dva';
import Title from '../../components/ListTitle';
import SelectSearch from '../../components/SelectSearch/index';
import CardContend from './components/card-conten/index';
import { ADDONS_PATH, WORKFLOWS_PATH } from '../../utils/common';
import Img from '../../assets/plugins.png';

type Props = {
  dispatch: ({}) => {};
  addonsList: [];
};

type State = {};

@connect((store: any) => {
  return store.addons;
})
class Addons extends React.Component<Props, State> {
  componentDidMount() {
    this.getAddonsList();
  }

  getAddonsList = async () => {
    this.props.dispatch({
      type: 'addons/getAddonsList',
      payload: {},
    });
  };
  render() {
    const { addonsList = [], dispatch } = this.props;
    return (
      <div>
        <Title
          title="Plug in management"
          subTitle="Plug in extension"
          dialogName={ADDONS_PATH}
          dispatch={dispatch}
        />
        <SelectSearch dispatch={dispatch} />
        <CardContend
          cardImg={Img}
          appContent={addonsList}
          path={ADDONS_PATH}
          workFlowPath={WORKFLOWS_PATH}
        />
      </div>
    );
  }
}

export default Addons;
