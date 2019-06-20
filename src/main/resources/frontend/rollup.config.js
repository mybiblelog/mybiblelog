import commonjs from 'rollup-plugin-commonjs';

export default [
  {
    input:  'scripts/modules.js',
    output: {
      file:    '../static/js/modules.js',
      format:  'iife',
      exports: 'named',
      name:    'Modules',
    },
    plugins: [commonjs()], // recognizes 'require(...)'
  },
];
