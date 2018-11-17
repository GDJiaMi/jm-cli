/**
 * build project
 */
import Table from 'cli-table2'
import webpack, { Configuration } from 'webpack'
import fs from 'fs-extra'
import chalk from 'chalk'
import formatMessages from 'webpack-format-messages'
import { inspect, shouldUseYarn } from '../utils'
import paths from '../paths'
import getOptions from '../options'
import configure from '../config'
import { CommonOption } from './type'

export interface BuildOption extends CommonOption {
  entry?: string[]
  group?: StringArrayObject
  measure?: boolean
  dontClean?: boolean
  dontCopy?: boolean
}

const mode = 'production'
const useYarn = shouldUseYarn()
process.env.NODE_ENV = mode

// initial env
require('../env')

function build(argv: BuildOption) {
  const environment = require('../env').default()
  const pkg = require(paths.appPackageJson)
  const jmOptions = getOptions(pkg, paths.ownLib)
  if (jmOptions == null) {
    return
  }

  let config: Configuration[] | Configuration

  if (argv.group) {
    const group = argv.group
    console.log(`Building multi-entry-group project:`)
    const table = new Table({
      head: ['Group', 'Entries'],
    })
    Object.keys(group).forEach(key => {
      // @ts-ignore
      table.push([key, group[key].join(', ')])
    })
    console.log(`\n${chalk.bgWhite(table.toString())}\n`)
    config = Object.keys(group).map(name =>
      configure(environment, pkg, paths, {
        name,
        entry: group[name],
        jmOptions,
      }),
    )
  } else if (argv.entry) {
    console.log(`Selected entries: ${chalk.cyan(argv.entry.join(', '))}`)
    config = configure(environment, pkg, paths, { entry: argv.entry, jmOptions })
  } else {
    config = configure(environment, pkg, paths, { jmOptions })
  }

  if (argv.inspect) {
    inspect(environment.raw, 'Environment:')
    inspect(config, 'Webpack Configuration:')
    return
  }

  if (argv.measure) {
    const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')
    const smp = new SpeedMeasurePlugin()
    config = smp.wrap(config)
  }

  console.log(chalk.cyan('Creating an optimized production build...'))
  const compiler = webpack(config as Configuration)

  compiler.run((err, stats) => {
    if (err) {
      console.error(chalk.red('❌ Failed to compile.'))
      console.error(err.stack || err)
      // @ts-ignore
      if (err.details) {
        // @ts-ignore
        console.error(err.details)
      }
      return
    }

    const messages = formatMessages(stats)
    if (messages.errors.length) {
      console.error(chalk.red('❌  Failed to compile.\n\n'))
      messages.errors.forEach(e => console.log(e))
      return
    }

    if (messages.warnings.length) {
      console.warn(chalk.yellow('⚠️  Compiled with warnings.\n\n'))
      messages.warnings.forEach(e => console.log(e))
    } else {
      console.log(chalk.green('Compiled successfully.'))
    }
    console.log(`\n✨ Call ${chalk.cyan(useYarn ? 'yarn serve' : 'npm run serve')} to test your bundles.`)
  })
}

export default (argv: BuildOption) => {
  if (!argv.dontClean) {
    fs.emptyDirSync(paths.appDist)
  }
  if (!argv.dontCopy) {
    fs.copySync(paths.appPublic, paths.appDist, { dereference: false })
  }
  build(argv)
}
