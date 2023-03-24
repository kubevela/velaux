import resolve from '@rollup/plugin-node-resolve';
import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';
import { externals } from 'rollup-plugin-node-externals';

const pkg = require('./package.json');

const config = [
  {
    input: './compiled/index.d.ts',
    plugins: [dts()],
    output: {
      file: pkg.publishConfig.types,
      format: 'es',
    },
  },
  {
    input: 'src/index.ts',
    plugins: [externals({ deps: true, packagePath: './package.json' }), resolve(), esbuild()],
    output: [
      {
        format: 'cjs',
        sourcemap: true,
        dir: pkg.publishConfig.main,
      },
      {
        format: 'esm',
        sourcemap: true,
        dir: pkg.publishConfig.module,
        preserveModules: true,
        preserveModulesRoot: `packages/velaux-data/src`,
      },
    ],
  },
];

export default config;
