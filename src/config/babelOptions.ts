/**
 * babel 配置选项
 */
import { ImportPlugin } from './type'

export default (isProduction: boolean, importPlugin?: ImportPlugin | ImportPlugin[]) => {
  return {
    babelrc: false,
    configFile: false,
    presets: [
      [
        require.resolve('@babel/preset-env'),
        {
          // We want Create React App to be IE 9 compatible until React itself
          // no longer works with IE 9
          targets: {
            ie: 9,
          },
          // Users cannot override this behavior because this Babel
          // configuration is highly tuned for ES5 support
          ignoreBrowserslistConfig: true,
          // If users import all core-js they're probably not concerned with
          // bundle size. We shouldn't rely on magic to try and shrink it.
          useBuiltIns: false,
          // Do not transform modules to CJS
          modules: false,
          // Exclude transforms that make all code slower
          exclude: ['transform-typeof-symbol'],
        },
      ],
      [
        require.resolve('@babel/preset-react'),
        {
          development: !isProduction,
          useBuiltIns: true,
        },
      ],
      require.resolve('@babel/preset-typescript'),
    ],
    plugins: [
      require.resolve('babel-plugin-macros'),
      require.resolve('@babel/plugin-transform-destructuring'),
      [require.resolve('@babel/plugin-proposal-decorators'), false],
      [require.resolve('@babel/plugin-proposal-class-properties'), { loose: true }],
      [require.resolve('@babel/plugin-proposal-object-rest-spread'), { useBuiltIns: true }],
      [
        require.resolve('@babel/plugin-transform-runtime'),
        {
          corejs: false,
          helpers: true,
          regenerator: true,
          // https://babeljs.io/docs/en/babel-plugin-transform-runtime#useesmodules
          // We should turn this on once the lowest version of Node LTS
          // supports ES Modules.
          useESModules: true,
        },
      ],
      require.resolve('@babel/plugin-syntax-dynamic-import'),
      isProduction && [
        // Remove PropTypes from production build
        require.resolve('babel-plugin-transform-react-remove-prop-types'),
        {
          removeImport: true,
        },
      ],
      // support antd, antd-mobile
      ...(importPlugin
        ? (Array.isArray(importPlugin) ? importPlugin : [importPlugin]).map(i => [
            require.resolve('babel-plugin-import'),
            i,
            i.libraryName,
          ])
        : []),
    ].filter(Boolean),
    overrides: [
      {
        test: /\.tsx?$/,
        plugins: [[require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }]],
      },
    ],
    compact: isProduction,
    cacheDirectory: true,
    cacheCompression: isProduction,
  }
}
