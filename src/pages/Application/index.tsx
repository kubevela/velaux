import React, { Component } from 'react';
import { connect } from 'dva';
import Title from './components/app-manager-title/index';
import SelectSearch from '../../components/SelectSearch/index';
import CardContend from '../../components/CardConten/index';
import '../../common.less';

type Props = {
  dispatch: ({}) => {};
  applicationList: [];
};
type State = {};

@connect((store: any) => {
  return { ...store.application, ...store.cluster };
})
class Application extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
  }

  componentDidMount() {
    this.getApplication();
  }

  getApplication = async () => {
    this.props.dispatch({
      type: 'application/getApplicationList',
      payload: {},
    });
  };

  render() {
    const { applicationList } = this.props;
    return (
      <div>
        <Title />
        <SelectSearch />
        <CardContend appContent={applicationList} />
      </div>
    );
  }
}

export default Application;
