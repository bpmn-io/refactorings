/* eslint-env node */
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import pkg from './package.json';
import postcss from 'rollup-plugin-postcss';
import path from 'path';

const nonbundledDependencies = Object.keys({
  ...pkg.dependencies,
  ...pkg.peerDependencies,
}).map(dependency => new RegExp(`^${dependency}($|/)`));

export default {
  input: 'lib/index.js',
  output: [ {
    file: 'dist/index.cjs.js',
    format: 'cjs',
    sourcemap: true
  },
  {
    file: 'dist/index.esm.js',
    format: 'esm',
    sourcemap: true
  } ],
  plugins: [
    commonjs(),
    json(),
    nodeResolve(),
    postcss({
      use: [ [
        'sass', {
          includePaths: [ path.resolve('node_modules') ]
        }
      ] ]
    })
  ],
  external: nonbundledDependencies
};