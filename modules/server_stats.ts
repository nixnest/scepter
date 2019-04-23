import { Message, Client, RichEmbed } from 'discord.js'
import { allChannelsByCategory } from '../lib/channels'

const _buildEmbed = (embed: RichEmbed, data) => {
  const _buildRoles = (data) => {
    const key = 'roles'
    embed.addField(key, data.fields[key].map(x => `${x[1]} (${x[0]}): ${x[2]} members`))
  }

  const _buildChannels = (data) => {
    const key = 'channels:'
    embed.addField(key, '--------')
    const channelsData = Object.entries(data.fields.channels)
    channelsData.map(x => {
      embed.addField(`${x[0]}:`, (x[1] as []).map(y => `${y[1]} (${y[0]}): ${y[2]}`))
      // TODO: we have a types conflict here. Define a stats Type
    })
  }

  embed.setTitle(`Server stats for ${data.name}`)
  _buildRoles(data)
  _buildChannels(data)
  embed.setFooter(`Server created at ${data.creationDate}`)
  return embed
}

const buildEmbed = (data) => {
  // TODO: Export as generic function and define _buildEmbed requirements?
  let embed = new RichEmbed()
  return _buildEmbed(embed, data)
}

const refreshCache = async (client: Client): Promise<void> => {
  for (let guild of client.guilds) {
    const clientGuild = guild[1]
    const guildData = {
      name: clientGuild.name,
      creationDate: clientGuild.createdAt,
      fields: {
        roles: clientGuild.roles.map(x => [x.id, x.name, x.members.size]),
        channels: allChannelsByCategory(clientGuild.channels.array())
      }
    }
    await client['guildData'].set(`${clientGuild.id}.stats`, guildData)
  }
}

const stats = async (message: Message, _) => {
  const embedMessage = buildEmbed(message.client['guildData'].get(`${message.guild.id}.stats`))
  return message.channel.send(embedMessage)
}

export const name = 'server stats'
export const commands = [
  {
    name: 'stats',
    description: 'Displays server statistics',
    examples: ['stats'],
    minArgs: 0,
    maxArgs: 0,
    run: stats
  }
]
export const jobs = [
  {
    period: 3600,
    job: refreshCache,
    runInstantly: true
  }
]
