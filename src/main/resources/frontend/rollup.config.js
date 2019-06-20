import commonjs from 'rollup-plugin-commonjs';

export default {
	output: {
	  file: 'bible.js',
	  format: 'iife',
	  name: 'Bible'
	},
	plugins: [commonjs()] // recognizes 'require(...)'
};