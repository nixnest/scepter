'use strict'

require('dotenv').config()
const Discord = require('discord.js')
const Enmap = require('enmap')
const fs = require('fs')

const log = require('./lib/log.js')

const client = new Discord.Client()

client.guildData = new Enmap({
  name: 'guilds'
})

client.userData = new Enmap({
  name: 'users'
})

client.muteData = new Enmap({
  name: 'mutes'
})

if (!process.env.BOT_GUILD) {
  log.error('No Discord guild ID supplied. Set the DISCORD_GUILD environment variable.')
}

if (!process.env.DISCORD_TOKEN) {
  log.error('No Discord authentication token supplied. Set the DISCORD_TOKEN environment variable.')
} else {
  client.login(process.env.DISCORD_TOKEN)
}

const defaultGuildData = {
  prefix: 's.'
}

const loadedModules = {}

// const unloadModule = (name) => {
//   // TODO
// }

const loadModule = (name) => {
  const module = require(`./modules/${name}`)
  loadedModules[name] = module
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

client.on('message', async (message) => {
  client.guildData.ensure(message.guild.id, defaultGuildData)
  const prefix = await client.guildData.get(message.guild.id, 'prefix')
  if (message.content.startsWith(`${prefix}`) && !message.author.bot) {
    Object.keys(loadedModules).forEach((module) => {
      loadedModules[module].commands.forEach((command) => {
        const name = message.content.split(prefix)[1].split(' ')[0]
        const matches = command.aliases.concat([command.name])
        if (matches.includes(name)) {
          const args = message.content.split(' ').slice(1) // TODO: better arg parsing
          if (args.length > command.maxArgs) {
            return message.channel.send(`Too many arguments for \`${prefix}${name}\`. (max: ${command.maxArgs})`)
          } else if (args.length < command.minArgs) {
            return message.channel.send(`Too few arguments for \`${prefix}${name}\`. (min: ${command.minArgs})`)
          } else {
            return command.run(message, args)
          }
        }
      })
    })
  }
})
