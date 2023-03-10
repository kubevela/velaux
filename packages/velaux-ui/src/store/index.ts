import { DvaInstance } from 'dva';

const context = require.context('../model', false, /\.(js|ts|jsx|tsx)$/);
const getModel = context.keys().map((key) => context(key));

export const createModel = function (app: DvaInstance) {
  //bind model to app.model
  return getModel.map((model) => app.model(model.default));
};
