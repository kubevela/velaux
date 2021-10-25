const context = require.context('../pages/Model', false, /\.(js|jsx|tsx)$/);
const getModel = context.keys().map((key) => context(key));

export const createModel = function (app) {
  //bind model to app.model
  return getModel.map((model) => app.model(model.default));
};
