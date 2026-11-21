import { createConfigForNuxt } from '@nuxt/eslint-config/flat';
import { core, style, typescript } from '../eslint.base.mjs';

export default createConfigForNuxt()
  .prepend({
    ignores: ['.nuxt/', '.output/', '.data/', 'content/', 'public/'],
  })
  .append(core, style, typescript, {
    name: 'mbl/web',
    rules: {
      'vue/component-name-in-template-casing': ['error', 'kebab-case', { registeredComponentsOnly: true }],
    },
  }, {
    name: 'mbl/web/scripts',
    files: ['scripts/**'],
    rules: {
      'no-console': 'off',
    },
  });
