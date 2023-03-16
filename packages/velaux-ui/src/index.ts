import dva from 'dva';
import createLoading from 'dva-loading';
import RouterView from './router';
import { createModel } from './store';
import { locationService } from './services/LocationService';
import './i18n';

const app = dva({
  history: locationService.getHistory(),
});

app.use(createLoading());
createModel(app);
app.router(RouterView);
app.start('#root');
