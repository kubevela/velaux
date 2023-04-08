import resolve from '@rollup/plugin-node-resolve';
import path from 'path';
import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';
import { externals } from 'rollup-plugin-node-externals';
import json from '@rollup/plugin-json';
import less from 'rollup-plugin-less';
import image from '@rollup/plugin-image';

const pkg = require('./package.json');

export default [
  {
    input: 'src/types.ts',
    plugins: [externals({ deps: true, packagePath: './package.json' }), resolve(), esbuild(), json(), less(), image()],
    output: [
      {
        format: 'cjs',
        sourcemap: true,
        dir: path.dirname(pkg.publishConfig.main),
      },
      {
        format: 'esm',
        sourcemap: true,
        dir: path.dirname(pkg.publishConfig.module),
        preserveModules: true,
        // @ts-expect-error (TS cannot assure that `process.env.PROJECT_CWD` is a string)
        preserveModulesRoot: path.join(process.env.PROJECT_CWD, `packages/velux-ui/src`),
      },
    ],
  },
  {
    input: './compiled/types.d.ts',
    plugins: [dts()],
    external: [/\.less$/],
    output: {
      file: pkg.publishConfig.types,
      format: 'es',
    },
  },
];
