/**
 * 在生产环境 代理是无法生效的，所以这里没有生产环境的配置
 * The agent cannot take effect in the production environment
 * so there is no configuration of the production environment
 * For details, please see
 * https://pro.ant.design/docs/deploy
 */
const { PROXY_PORT } = process.env
const DEV_TAEGET = `http://localhost:${PROXY_PORT}`
const TEST_TAEGET = `http://localhost:${PROXY_PORT}`
const PRE_TAEGET = `http://localhost:${PROXY_PORT}`

export default {
  dev: {
    '/api': {
      target: DEV_TAEGET,
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
  test: {
    '/api': {
      target: TEST_TAEGET,
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
  pre: {
    '/api': {
      target: PRE_TAEGET,
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
};
