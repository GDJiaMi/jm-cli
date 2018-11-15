import fs from 'fs-extra'
import yargs from 'yargs'
import path from 'path'
import { transformString2Array } from './utils'
import { StartOption } from './cmds/start'
import { BuildOption } from './cmds/build'
import { AnalyzeOption } from './cmds/analyze'
import { ServeOption } from './cmds/serve'
import { UpgradeOption } from './cmds/upgrade'
import wrap from './middlewares'

process.on('uncaughtException', err => {
  throw err
})

const cwd = process.cwd()
const cmdDir = path.resolve(__dirname, '../')
const pkg = fs.readJSONSync(path.join(cmdDir, 'package.json'))
const name = pkg.name
const version = pkg.version
const cmdName = Object.keys(pkg.bin)[0]

yargs
  .scriptName(cmdName)
  .command(
    'create [name]',
    'Create React project',
    {
      name: { description: 'project name' },
      at: { description: 'sepcify jm-cli version', alias: 'a', type: 'string', requiresArg: true },
      template: { description: 'template name in npm, file:// or url', alias: 't', type: 'string', requiresArg: true },
    },
    wrap(argv => {
      require('./cmds/create').default(cwd, cmdDir, {
        name: argv.name,
        version: argv.at,
        template: argv.template,
      })
    }),
  )
  .command(
    ['start', '$0'],
    'Start development server',
    {
      entry: {
        description: 'sepcify entry names to build. example: a,b',
        alias: 'e',
        type: 'string',
        requiresArg: true,
        coerce: transformString2Array,
      },
    },
    wrap(argv => {
      require('./cmds/start').default(argv as StartOption)
    }),
  )
  .command(
    'build',
    'Build project for production',
    {
      entry: {
        description: 'sepcify entry names to build. example: a,b',
        alias: 'e',
        type: 'string',
        requiresArg: true,
        coerce: transformString2Array,
      },
      group: {
        desc: `sepcify entry group. It will override --entry. example --group.client=a,b --group.server=c,d`,
        type: 'string',
        requiresArg: true,
        coerce: argv => {
          if (Array.isArray(argv)) {
            return argv.reduce<StringArrayObject>((group, cur) => {
              const entry = transformString2Array(cur)
              const name = entry.join('_')
              group[name] = entry
              return group
            }, {})
          } else if (typeof argv === 'string') {
            return { default: transformString2Array(argv) }
          }

          return Object.keys(argv).reduce<StringArrayObject>((group, cur) => {
            group[cur] = transformString2Array(argv[cur])
            return group
          }, {})
        },
      },
      measure: {
        description: 'measures your webpack build speed',
        alias: 'm',
        type: 'boolean',
      },
    },
    wrap(argv => {
      let { entry, group, ...other } = argv
      if (group && group.default) {
        entry = [...(entry || []), ...group.default]
        group = undefined
      }

      require('./cmds/build').default({ entry, group, ...other } as BuildOption)
    }),
  )
  .command(
    'analyze',
    'Analyze webpack bundle',
    {
      entry: {
        description: 'sepcify entry names to build. example: a,b',
        alias: 'e',
        type: 'string',
        requiresArg: true,
        coerce: transformString2Array,
      },
    },
    wrap(argv => {
      require('./cmds/analyze').default(argv as AnalyzeOption)
    }),
  )
  .command(
    'serve',
    'serve builded content',
    {
      gzip: {
        description: 'enable gzip',
        alias: 'g',
        type: 'boolean',
        default: true,
      },
      cors: {
        description: 'enable CORS via the `Access-Control-Allow-Origin` header',
        type: 'boolean',
      },
      open: {
        description: 'open browser window after starting the server',
        alias: 'o',
        type: 'boolean',
      },
      f: {
        description: 'fall back to /index.html if nothing else matches',
        alias: 'history-api-fallback',
        type: 'boolean',
        default: true,
      },
    },
    wrap(argv => {
      require('./cmds/serve').default(argv as ServeOption)
    }),
  )
  .command(
    'upgrade',
    `upgrade ${name} in current project or global`,
    {
      'dry-run': {
        alias: 'd',
        type: 'boolean',
      },
      global: {
        description: 'global upgrade',
        alias: 'g',
        type: 'boolean',
      },
      yarn: {
        description: 'use yarn to upgrade. default is true if `yarn` command founded',
        alias: 'y',
        type: 'boolean',
      },
      // yargs 可以自动将yarn置为false
      'no-yarn': {
        description: 'no use yarn to upgrade.',
        type: 'boolean',
      },
      level: {
        description: `choose semver level. Global mode default is 'major', local mode default is 'minor'`,
        alias: 'l',
        type: 'string',
        choices: ['major', 'minor', 'patch'],
      },
    },
    wrap(argv => {
      require('./cmds/upgrade').default(argv as UpgradeOption)
    }),
  )
  .command('deploy', 'TODO', {}, wrap(argv => {}))
  .command('version', 'show version', {}, argv => {
    console.log(version)
  })
  .command('help', 'show helps', {}, () => {
    yargs.showHelp()
  })
  .version(version)
  .option('inspect', {
    description: 'inspect webpack configuration',
    type: 'boolean',
  })
  .help().argv
