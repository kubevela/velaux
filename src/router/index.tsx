import RouterMap from './map';
import Routes from './routes';

function RouterView(props: any) {
  const routes = props.routes ? props.routes : Routes;
  return <RouterMap routes={routes} {...props}></RouterMap>;
}

export default RouterView;
