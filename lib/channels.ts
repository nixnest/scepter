import { GuildChannel, TextChannel, VoiceChannel } from 'discord.js'

export const getCategoryName = (channel: GuildChannel) => {
  return channel.parent ? channel.parent.name : 'No Category'
}

export const getChannelTopic = (channel: TextChannel | VoiceChannel) => {
  if (channel.type === 'text') {
    return (channel as TextChannel).topic || 'No Topic'
  } else {
    return 'Voice Channel'
  }
}

export const allChannelsByCategory = (channels: Array<GuildChannel>) => {
  const allCategories = [...new Set(channels.map(getCategoryName))]
    .reduce((init, val) => {
      init[val] = []
      return init
    }, {})
  channels.filter(x => ['text', 'voice'].includes(x.type)).map((x: TextChannel) => {
    allCategories[getCategoryName(x)].push([x.id, x.name, getChannelTopic(x)])
  })
  return allCategories
}
