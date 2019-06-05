import { Message, Client, RichEmbed, MessageReaction, User } from 'discord.js'
import { allChannelsByCategory } from '../lib/channels'
import { paginableEmbeds, PaginableEmbed } from '../lib/embeds/paginable_embed'
import { StatsPaginableEmbedBuilder } from '../lib/embeds/stats_embed_builder'

const ALLOWED_REACTIONS = ['⬅', '➡']

const buildEmbed = (data): RichEmbed => {
  return new StatsPaginableEmbedBuilder()
               .setPerPage(3)  // TODO: make page size configurable at runtime?
               .makeChannels(data)
               .makeRoles(data)
               .setPaginables()
               .build()
               .setTitle(`Server stats for ${data.name}`)
               .setFooter(`Server created at ${data.creationDate}`)
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
  const guildStats = message.client['guildData'].get(`${message.guild.id}.stats`)
  const embedMessage: RichEmbed = buildEmbed(guildStats)
  const statsMessage: Message | Message[] = await message.channel.send(embedMessage) as Message
  await statsMessage.react('⬅')
  await statsMessage.react('➡')
  const statsMessageId: string = statsMessage.id
  paginableEmbeds.set(`stats.${statsMessageId}`, embedMessage)  // Namespace the ID
  paginableEmbeds.set(`stats.${statsMessageId}.currentPage`, 0)  // Start on the first page
}

const paginateEmbed = async (reaction: MessageReaction, user: User) => {
  if (reaction.message.embeds.length === 0 ||  // We don't care about reactions on non-embeds here
      user.bot ||  // Or bot reactions
      !ALLOWED_REACTIONS.includes(reaction.emoji.name)) {  // or non-pagination ones
    return
  }

  const messageId = reaction.message.id
  const embedMessage: PaginableEmbed = paginableEmbeds.get(`stats.${messageId}`)
  if (embedMessage == null) {  // Don't do anything for embeds no longer stored
    return
  }

  let page = paginableEmbeds.get(`stats.${messageId}.currentPage`)

  const leftPaginate = reaction.message.reactions.filter(x => x.emoji.name === '⬅').first().count
  const rightPaginate = reaction.message.reactions.filter(x => x.emoji.name === '➡').first().count

  const pagination = rightPaginate - leftPaginate
  const newPage = Math.min(Math.max(0, page + pagination), embedMessage.pagesCount)
  const newContent = embedMessage.paginate(newPage)

  newContent.forEach((val, idx) => {
    reaction.message.embeds[0].fields[idx].value = val.reduce((acc, val) => acc += `${val}\n`, '')
  })
  paginableEmbeds.set(`stats.${messageId}.currentPage`, newPage)

  await reaction.message.edit(new RichEmbed(reaction.message.embeds[0]))
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

export const events = [
  {
    trigger: 'messageReactionAdd',
    event: paginateEmbed
  }
]
