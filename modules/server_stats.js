const Discord = require('discord.js')

let buildEmbed = async (data) => {
  let embed = new Discord.RichEmbed()
  let embedField, embedValue
  embed.setTitle(`Server stats for ${data.name}`)
  data.fields.map(field => {
    embedField = Object.entries(field)
    embedValue = embedField[0][1].map(val => Object.values(val))
                                 .map(x => `${x[1]} (${x[0]})`)
    embed.addField(embedField[0][0], embedValue)
  })
  embed.setFooter(`Server created at ${data.creationDate}`)
  return embed
}

let refreshCache = async (client) => {
  for (let guild of client.guilds) {
    const clientGuild = guild[1]
    const guildData = {
      name: clientGuild.name,
      creationDate : clientGuild.createdAt,
      fields: [{
        roles: clientGuild.roles.map(x => [x.id, x.name]),
      },
      {
        channels: clientGuild.channels.map(x => [x.id, x.name]),
      }]
    }
    await client.guildData.set(`${clientGuild.id}.stats`, guildData)
  }
}

let stats = async (message, _) => {
  const embedMessage = await buildEmbed(message.client.guildData.get(`${message.guild.id}.stats`))
  return message.channel.send(embedMessage)
}

module.exports = {
  name: 'server stats',
  commands: [
    {
      name: 'stats',
      description: 'Displays server statistics',
      examples: ['stats'],
      minArgs: 0,
      maxArgs: 0,
      run: stats
    }
  ],
  jobs: [
    {
      period: 3600,
      job: refreshCache,
      runInstantly: true
    }
  ]
}