'use strict'

require('dotenv').config()
const Discord = require('discord.js')
const Enmap = require('enmap')
const fs = require('fs')

const log = require('./lib/log.js')

const client = new Discord.Client()

client.log = log

client.guildData = new Enmap({
  name: 'guilds'
})

client.userData = new Enmap({
  name: 'users'
})

client.timerData = new Enmap({
  name: 'timers'
})

client.loadedModules = {}

if (!process.env.BOT_GUILD) {
  log.error('No Discord guild ID supplied. Set the BOT_GUILD environment variable.')
}

if (!process.env.DISCORD_TOKEN) {
  log.error('No Discord authentication token supplied. Set the DISCORD_TOKEN environment variable.')
} else {
  client.login(process.env.DISCORD_TOKEN)
}

const loadModule = name => {
  const module = require(`./modules/${name}`)
  if (module.jobs) {
    module.jobs.map(x => {
      setInterval(() => x.job(client), x.period * 1000)
      if (x.runInstantly) {
        x.job(client)
      }
    })
  }
  client.loadedModules[name] = module
}

const parseArgs = messageContent => {
  if (!messageContent) return []
  return messageContent.match(/\\?.|^$/g).reduce((p, c) => {
    if (c === '"') {
      p.quote ^= 1
    } else if (!p.quote && c === ' ') {
      p.a.push('')
    } else {
      p.a[p.a.length - 1] += c.replace(/\\(.)/, '$1')
    }
    return p
  }, { a: [''] }).a
}

const runCommand = async (message, command, args) => {
  if (command.cooldown != null) {
    await client.userData.ensure(`${message.author.id}.cooldowns.${command.name}`, new Date(0))
    const cooldownExpiryDate = new Date(client.userData.get(`${message.author.id}.cooldowns.${command.name}`))
    if (cooldownExpiryDate.getTime() > message.createdTimestamp) {
      return message.channel.send(`This command has a cooldown of ${command.cooldown} seconds. (${new Date(cooldownExpiryDate - Date.now()).getSeconds() + 1} left)`)
    }
    await client.userData.set(`${message.author.id}.cooldowns.${command.name}`, new Date(message.createdTimestamp + command.cooldown * 1000))
  }
  if (args.length > command.maxArgs) {
    return message.channel.send(`Too many arguments for \`${command.name}\`. (max: ${command.maxArgs}, you might need to quote an argument) `)
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
  client.botGuild = await client.guilds.get(process.env.BOT_GUILD)
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

client.on('message', async message => {
  await client.guildData.ensure(message.guild.id, { prefix: 's.' })
  const prefix = await client.guildData.get(message.guild.id, 'prefix')
  // TODO: manage guild specific aliases here
  // TODO: permission levels

  // TODO: iterating over all the modules is SLOW, make a loadedCommands
  if (message.content.startsWith(`${prefix}`) && !message.author.bot) {
    Object.keys(client.loadedModules).forEach(async moduleIndex => {
      client.loadedModules[moduleIndex].commands.forEach(async command => {
        const commandName = message.content.split(prefix)[1].split(' ')[0]
        const possibleNames = command.aliases
          ? command.aliases.concat([command.name])
          : [command.name]
        if (possibleNames.includes(commandName)) {
          const messageContentWithoutPrefixOrCommandName = message.content.substr(prefix.length + 1 + commandName.length)
          runCommand(message, command, parseArgs(messageContentWithoutPrefixOrCommandName))
        }
      })
    })
  }
})
