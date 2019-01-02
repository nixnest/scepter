'use strict'

import { Client, Message } from 'discord.js'
import * as dotenv from 'dotenv'
import Enmap from 'enmap'
import * as fs from 'fs'

import * as log from './lib/log.js'

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

if (!process.env.BOT_GUILD) {
  log.error('No Discord guild ID supplied. Set the BOT_GUILD environment variable.')
}

if (!process.env.DISCORD_TOKEN) {
  log.error('No Discord authentication token supplied. Set the DISCORD_TOKEN environment variable.')
} else {
  client.login(process.env.DISCORD_TOKEN)
}

interface Command {
  name: string,
  description: string,
  examples: string[],
  minArgs: number
  maxArgs: number,
  permissionLevel?: number,
  secret?: boolean,
  cooldown?: number,
  aliases?: string[],
  run (message: Message, args: string[]): Promise<Message>,
}

interface Event {
  trigger: string,
  event (object: any): Promise<Message>  // TODO: is this correct? Verify with further examples
}

interface Job {
  period: number,
  runInstantly: boolean,
  job (client: Client): Promise<void>
}

interface Module {
  name: string,
  commands: Command[]
  jobs?: Job[],
  events?: Event[]
}

const loadModule = (name: string) => {
  import(`./modules/${name}`).then((module: Module) => {
    if (module.jobs) {
      module.jobs.map((x: Job) => {
        setInterval(() => x.job(client), x.period * 1000)
        if (x.runInstantly) {
          x.job(client)
        }
      })
    }
    client['loadedModules'][name] = module
  })
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
  } else if (args.length < command.minArgs) {
    return message.channel.send(`Too few arguments for \`${command.name}\`. (min: ${command.minArgs})`)
  } else {
    try {
      return await command.run(message, args)
    } catch (e) {
      await message.channel.send(`Error: \`${e}\``)
      return log.warn(`\`${command.name} ${args}\` errored with \`${e}\``, message.client)
    }
  }
}

client.on('ready', async () => {
  client['botGuild'] = await client.guilds.get(process.env.BOT_GUILD)
  log.info(`Logged in as ${client.user.tag}!`, client)
  fs.readdir('./modules/', (err, files) => {
    if (err) {
      return log.error('Failed to load modules folder', client)
    } else {
      files.forEach(file => {
        const name = file.split('.')[0]
        log.info(`Loading module ${name}`, client)
        loadModule(name)
      })
    }
  })
})

client.on('message', async (message: Message) => {
  await client['guildData'].ensure(message.guild.id, { prefix: 's.' })
  const prefix = await client['guildData'].get(message.guild.id, 'prefix')
  // TODO: manage guild specific aliases here
  // TODO: permission levels

  // TODO: iterating over all the modules is SLOW, make a loadedCommands
  if (message.content.startsWith(`${prefix}`) && !message.author.bot) {
    Object.keys(client['loadedModules']).forEach(async moduleIndex => {
      client['loadedModules'][moduleIndex].commands.forEach(async command => {
        const commandName = message.content.split(prefix)[1].split(' ')[0]
        const possibleNames = command.aliases
          ? command.aliases.concat([command.name])
          : [command.name]
        if (possibleNames.includes(commandName)) {
          const messageContentWithoutPrefixOrCommandName = message.content.substr(
            prefix.length + 1 + commandName.length)
          runCommand(message, command, parseArgs(messageContentWithoutPrefixOrCommandName))
        }
      })
    })
  }
})
