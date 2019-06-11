'use strict'

import { Client, Message } from 'discord.js'
import * as dotenv from 'dotenv'
import Enmap from 'enmap'
import * as fs from 'fs'

import * as log from './lib/log'

dotenv.config()
const client = new Client()

client['log'] = log

client['guildData'] = new Enmap({
  name: 'guilds'
})

client['userData'] = new Enmap({
  name: 'users'
})

client['timerData'] = new Enmap({
  name: 'timers'
})

client['loadedModules'] = {}
client['loadedCommands'] = {}

if (!process.env.SCEPTER_BOT_GUILD) {
  log.error('No Discord guild ID supplied. Set the SCEPTER_BOT_GUILD environment variable.')
}

if (!process.env.SCEPTER_OWNER_ID) {
  log.error('No owner user Discord ID supplied. Set the SCEPTER_OWNER_ID environment variable.')
}

client['ownerId'] = process.env.SCEPTER_OWNER_ID

if (!process.env.SCEPTER_DISCORD_TOKEN) {
  log.error('No Discord authentication token supplied. Set the SCEPTER_DISCORD_TOKEN environment variable.')
}

client.login(process.env.SCEPTER_DISCORD_TOKEN)
      .catch(console.error)

type Command = {
  name: string,
  description: string,
  examples: string[],
  minArgs: number
  maxArgs: number,
  permissionLevel?: number,
  secret?: boolean,
  cooldown?: number,
  aliases?: string[],
  run (message: Message, args: string[]): Promise<Message>
}

type Event = {
  trigger: string,
  event (): Promise<any>  // TODO: is this correct? Verify with further examples
}

type Job = {
  period: number,
  runInstantly: boolean,
  job (client: Client): Promise<void>,
  interval: NodeJS.Timeout
}

type Module = {
  name: string,
  commands?: Command[]
  jobs?: Job[],
  events?: Event[],
  loadOnBoot?: boolean
}

export const availableModules: string[] = []

export const loadModule = (name: string, initial: boolean = false) => {
  import(`./modules/${name}`).then((module: Module) => {
    if (initial && module.loadOnBoot != null && module.loadOnBoot === false) {
      return
    }

    log.info(`Loading module ${name}`, client)

    if (module.jobs) {
      module.jobs.map((x: Job) => {
        x.interval = setInterval(() => x.job(client), x.period * 1000)
        if (x.runInstantly) {
          x.job(client)
           .catch(log.warn)
        }
      })
    }
    if (module.commands) {
      module.commands.map(command => {
        const possibleNames = command.aliases
          ? command.aliases.concat([command.name])
          : [command.name]
        possibleNames.map(name => {
          client['loadedCommands'][name] = command
        })
      })
    }
    if (module.events) {
      module.events.map(async (event: Event) => {
        client.on(event.trigger, event.event)
      })
    }
    client['loadedModules'][name] = module
  }).catch(err => log.warn(err, client))
}

export const unloadModule = (name: string) => {
  const module = client['loadedModules'][name]
  let possibleNames: string[]

  if (module) {
    if (module.jobs && module.jobs.length > 0) {
      module.jobs.forEach((job: Job) => {
        clearInterval(job.interval)
      })
    }

    if (module.events && module.events.length > 0) {
      module.events.forEach((event: Event) => {
        client.removeListener(event.trigger, event.event)
      })
    }

    if (module.commands && module.commands.length > 0) {
      module.commands.forEach((command: Command) => {
        possibleNames = command.aliases
          ? command.aliases.concat([command.name])
          : [command.name]
        possibleNames.map(commandName => {
          Reflect.deleteProperty(client['loadedCommands'], commandName)
        })
      })

      Reflect.deleteProperty(client['loadedModules'], name)
    }
  }
}

const parseArgs = (messageContent: string) => {
  if (!messageContent) return []
  return messageContent.match(/\\?.|^$/g).reduce((p, c) => {
    if (c === '"') {
      p['quote'] ^= 1
    } else if (!p['quote'] && c === ' ') {
      p.a.push('')
    } else {
      p.a[p.a.length - 1] += c.replace(/\\(.)/, '$1')
    }
    return p
  }, { a: [''] }).a
}

const runCommand = async (message: Message, command: Command, args: string[]) => {
  if (command.cooldown != null) {
    await client['userData'].ensure(`${message.author.id}.cooldowns.${command.name}`, new Date(0))
    const cooldownExpiryDate = new Date(client['userData']
                               .get(`${message.author.id}.cooldowns.${command.name}`))
    if (cooldownExpiryDate.getTime() > message.createdTimestamp) {
      return message.channel.send(
        `This command has a cooldown of ${command.cooldown} seconds.`
        + `(${new Date(+cooldownExpiryDate - Date.now()).getSeconds() + 1} left)`)
    }
    await client['userData'].set(`${message.author.id}.cooldowns.${command.name}`,
                                  new Date(message.createdTimestamp + command.cooldown * 1000))
  }
  if (args.length > command.maxArgs) {
    return message.channel.send(
      `Too many arguments for \`${command.name}\`. (max: ${command.maxArgs}, `
      + `you might need to quote an argument) `)
  }
  if (args.length < command.minArgs) {
    return message.channel.send(`Too few arguments for \`${command.name}\`. (min: ${command.minArgs})`)
  }
  try {
    // TODO: test if shit works with an empty permissionLevel
    if (command.permissionLevel && command.permissionLevel > 0) {
      switch (command.permissionLevel) {
        case 1:
          if (!message.member.hasPermission('MANAGE_MESSAGES')) {
            return message.channel.send(`You don't have permission to execute this command, which requires the Manage Messages permission.`)
          }
          break
        case 2:
          if (!message.member.hasPermission('MANAGE_GUILD')) {
            return message.channel.send(`You don't have permission to execute this command, which requires the Manage Server permission.`)
          }
          break
        case 3:
          if (message.author.id !== client['ownerId']) {
            return message.channel.send(`You don't have permission to execute this command, which requires ownership of this bot.`)
          }
          break
        default:
          log.warn(`\`${command.name}\` has an invalid permissionLevel of ${command.permissionLevel}`, message.client)
          return message.channel.send(`Internal error: invalid permissionLevel (${command.permissionLevel}) on command \`${command.name}\``)
      }
    }
    return await command.run(message, args)
  } catch (e) {
    await message.channel.send(`Error: \`${e}\``)
    return log.warn(`\`${command.name} ${args}\` errored with \`${e}\``, message.client)
  }
}

client.on('ready', async () => {
  client['botGuild'] = client.guilds.get(process.env.SCEPTER_BOT_GUILD)
  log.info(`Logged in as ${client.user.tag}! Add bot with https://discordapp.com/api/oauth2/authorize?client_id=${client.user.id}&scope=bot`, client)
  fs.readdir('./modules/', (err, files) => {
    if (err) {
      return log.error('Failed to load modules folder', client)
    } else {
      files.forEach(async file => {
        const name = file.split('.')[0]
        availableModules.push(name)
        loadModule(name, true)
      })
    }
  })
})

client.on('message', async (message: Message) => {
  await client['guildData'].ensure(message.guild.id, { prefix: 's.' })
  const prefix = await client['guildData'].get(message.guild.id, 'prefix')
  if (message.content.startsWith(`${prefix}`) && !message.author.bot) {
    const commandName = message.content.split(prefix)[1].split(' ')[0]
    if (client['loadedCommands'][commandName]) {
      const messageContentWithoutPrefixOrCommandName = message.content.substr(prefix.length + 1 + commandName.length)
      await runCommand(message, client['loadedCommands'][commandName], parseArgs(messageContentWithoutPrefixOrCommandName))
    }
  }
})

client.on('error', (err: Error) => {
  log.warn(`Discord.js error: ${err}`)
})
