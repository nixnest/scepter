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

client.muteData = new Enmap({
  name: 'mutes'
})

if (!process.env.BOT_GUILD) {
  log.error('No Discord guild ID supplied. Set the BOT_GUILD environment variable.')
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

const loadModule = name => {
  const module = require(`./modules/${name}`)
  if (module.events != null) {
    for (let event of module.events) {
      client.on(event.trigger, event.run)
    }
  }
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

client.on('message', async message => {
  client.guildData.ensure(message.guild.id, defaultGuildData)
  const prefix = await client.guildData.get(message.guild.id, 'prefix')
  if (message.content.startsWith(`${prefix}`) && !message.author.bot) {
    Object.keys(loadedModules).forEach(async module => {
      loadedModules[module].commands.forEach(async command => {
        const name = message.content.split(prefix)[1].split(' ')[0]
        const matches = command.aliases.concat([command.name])
        if (matches.includes(name)) {
          const args = message.content.match(/\\?.|^$/g).reduce((p, c) => {
            if (c === '"') {
              p.quote ^= 1
            } else if (!p.quote && c === ' ') {
              p.a.push('')
            } else {
              p.a[p.a.length - 1] += c.replace(/\\(.)/, '$1')
            }
            return p
          }, { a: [''] }).a.slice(1) // split into args but allow quoted strings to stay together
          if (args.length > command.maxArgs) {
            return message.channel.send(`Too many arguments for \`${prefix}${name}\`. (max: ${command.maxArgs}, you might need to quote an argument) `)
          } else if (args.length < command.minArgs) {
            return message.channel.send(`Too few arguments for \`${prefix}${name}\`. (min: ${command.minArgs})`)
          } else {
            try {
              return await command.run(message, args)
            } catch (e) {
              await message.channel.send(`Error: \`${e}\``)
              return log.warn(`\`${command.name} ${args}\` errored with \`${e}\``, message.client)
            }
          }
        }
      })
    })
  }
})
