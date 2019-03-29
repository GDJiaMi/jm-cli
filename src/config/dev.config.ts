/**
 * 开发环境配置
 */
import webpack from 'webpack'
import path from 'path'
import fs from 'fs-extra'
import { message } from '../utils'
import HtmlInjectedDllReferences from './plugins/HtmlInjectedDllReferences'
import { WebpackConfigurer } from './type'

const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')

const configure: WebpackConfigurer = (enviroments, pkg, paths, argv) => {
  function isSupportDll() {
    if (enviroments.raw.DISABLE_DLL === 'true') {
      return false
    }
    return fs.existsSync(paths.appDllHash)
  }

  const supportDll = isSupportDll()
  if (supportDll) {
    message.info('DllReference Turned on')
  }

  return {
    entry: {},
    devtool:
      enviroments.raw.SOURCE_MAP === 'false'
        ? false
        : enviroments.raw.EVAL === 'true'
        ? 'cheap-module-eval-source-map'
        : 'cheap-module-source-map',
    module: {
      rules: [],
    },
    plugins: [
      new webpack.HotModuleReplacementPlugin(),
      // 在windows下大小写是不敏感的，这在其他端会导致问题
      new CaseSensitivePathsPlugin(),
      supportDll &&
        new webpack.DllReferencePlugin({
          context: paths.appSrc,
          manifest: path.join(paths.appCache, 'dll.json'),
          name: 'dll',
        }),
      supportDll && new HtmlInjectedDllReferences('dll'),
    ].filter(Boolean),
    optimization: {
      // 使用可读性更高的模块标识符， 在开发环境更容易debug, 取代NamedModulesPlugin
      // 默认在development环境下是开启的
      namedModules: true,
      namedChunks: true,
      noEmitOnErrors: true,
    },
  }
}

export default configure
