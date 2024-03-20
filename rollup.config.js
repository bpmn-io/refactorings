/* eslint-env node */
const commonjs = require('@rollup/plugin-commonjs');
const json = require('@rollup/plugin-json');

const pkg = require('./package.json');
const nonbundledDependencies = Object.keys({ ...pkg.dependencies });

const nodeResolve = require('@rollup/plugin-node-resolve');

module.exports = {
  input: 'lib/index.js',
  output: [ {
    file: 'dist/index.cjs.js',
    format: 'cjs'
  },
  {
    file: 'dist/index.esm.js',
    format: 'esm'
  } ],
  plugins: [
    commonjs(),
    json(),
    nodeResolve()
  ],
  external: nonbundledDependencies
};