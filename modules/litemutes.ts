import { Client, Guild, GuildMember, Role, Message, User } from 'discord.js'

import * as log from '../lib/log'

const INDEFINITE_LITEMUTE = Math.pow(2, 64)

const _getGuildLiteMutesRole = async (guild: Guild): Promise<Role> => {
  let role = guild.client['guildData'].get(`${guild.id}.LiteMutedRole`)
  if (role == null) {
    role = guild.roles.find(x => x.name === 'lite-muted')
    if (role == null) {
      throw new Error('No lite-muted role set and a default role could not be found.')
    }
  }
  return role
}

const _removeMemberFromLiteMutes = async (client: Client, liteMuteId: string) => {
  await client['timerData'].delete(liteMuteId)
}

const checkLiteMutes = async (client: Client) => {
  let curDate = new Date()
  let clientGuild: Guild
  let guildMember: GuildMember
  let clientGuildId: string
  let guildMemberId: string
  let liteMuteRole: Role

  console.log(client['timerData'].entries())

  for (let entry of client['timerData'].entries()) {
    if (entry[1] === INDEFINITE_LITEMUTE) continue
    if (curDate > entry[1]) {
      // UnLiteMute the user
      [clientGuildId, guildMemberId] = entry[0].split('.')
      clientGuild = client.guilds.get(clientGuildId)

      try {
        guildMember = await clientGuild.fetchMember(guildMemberId)
      } catch (e) {
        await _removeMemberFromLiteMutes(client, `${clientGuild.id}.${guildMemberId}`)
        continue
      }

      try {
        liteMuteRole = await _getGuildLiteMutesRole(clientGuild)
      } catch (e) {
        log.warn(e)
        continue
      }

      try {
        await guildMember.removeRole(liteMuteRole)
      } catch (e) {
        log.warn(`${name}.job: ${e}`)
        return
      }

      delete client['timerData'][entry[0]]
    }
  }
}

const setLiteMutedRole = async (message: Message, args: string[]) => {
  const roleId = args[0]
  const roleName = message.guild.roles.get(roleId)
  let returnMessage: String
  if (roleName) {
    await message.client['guildData'].set(`${message.guild.id}.liteMutedRole`, roleId)
    returnMessage = `Role ${roleName} has been set as the lite-muted role.`
  } else {
    returnMessage = `That role does not exist, dummy.`
  }
  return message.channel.send(returnMessage)
}

const liteMute = async (message: Message, args: string[]) => {
  const liteMuteTargetId = message.mentions.users.first().id
  const curDate = new Date()
  const liteMutePeriod = args[1]
    ? new Date(curDate.setSeconds(curDate.getSeconds() + parseInt(args[1], 10)))
    : INDEFINITE_LITEMUTE
  const liteMuteRole: Role = await _getGuildLiteMutesRole(message.guild)
  const liteMuteTarget: GuildMember = await message.guild.fetchMember(liteMuteTargetId)

  try {
    await liteMuteTarget.addRole(liteMuteRole)
  } catch {
    return message.channel.send("I don't have permission to manage roles!")
  }
  await message.client['timerData'].set(`${message.guild.id}.${liteMuteTargetId}`, liteMutePeriod)

  const liteMutePeriodText = liteMutePeriod === INDEFINITE_LITEMUTE ? 'indefinitely' : `for ${args[1]} seconds`
  return message.channel.send(`User ${args[0]} has been lite-muted ${liteMutePeriodText}.`)
}

const unLiteMute = async (message: Message, args: string[]) => {
  const liteMuteTargetId = message.mentions.users.first().id
  const liteMuteRole = await _getGuildLiteMutesRole(message.guild)
  const liteMuteTarget = await message.guild.fetchMember(liteMuteTargetId)

  try {
    await liteMuteTarget.removeRole(liteMuteRole)
  } catch {
    return message.channel.send("I don't have permission to manage roles!")
  }

  message.client['timerData'].delete(`${message.guild.id}.${liteMuteTargetId}`)
  return message.channel.send(`User ${args[0]} has been un-lite-muted.`)
}

const newcomerLiteMuteCheck = async (member: GuildMember) => {
  const LiteMuteRole = await _getGuildLiteMutesRole(member.guild)
  if (member.client['timerData'].has(`${member.guild.id}.${member.id}`)) {
    try {
      await member.addRole(liteMuteRole)
    } catch (e) {
      log.warn(`${name}.newcomerLiteMuteCheck: ${e}`)
      return
    }
  }
}

const processManualLiteMute = async (previous: GuildMember, actual: GuildMember) => {
  let liteMuteRole: Role | null

  try {
    liteMuteRole = await _getGuildLiteMutesRole(actual.guild)
  } catch (e) {
    log.warn(e)
    return
  }

  const isListed = actual.client['timerData'].has(`${actual.guild.id}.${actual.id}`)
  const hadRole = previous.roles.has(liteMuteRole.toString())
  const hasRole = actual.roles.has(liteMuteRole.toString())

  if (!isListed && !hadRole && hasRole) {
    await actual.client['timerData'].set(`${actual.guild.id}.${actual.id}`, INDEFINITE_LITEMUTE)
  }
  if (isListed && hadRole && !hasRole) {
    await actual.client['timerData'].delete(`${actual.guild.id}.${actual.id}`)
  }
}

const removeLiteMuteFromBannedUser = async (guild: Guild, user: User) => {
  return _removeMemberFromLiteMutes(guild.client, `${guild.id}.${user.id}`)
}

export const name = 'lite-mute'
export const commands = [
  {
    name: 'setlitemutedrole',
    description: 'Sets the given role ID to use as the LiteMute role',
    examples: ['setlitemutedrole 522963469046120479'],
    secret: false,
    permissionLevel: 2,
    minArgs: 1,
    maxArgs: 1,
    aliases: [],
    run: setLiteMutedRole
  },
  {
    name: 'litemute',
    description: 'Lite-mutes an user indefinitely or for a period of time',
    examples: ['litemute @Sky Aviatour#3415'],
    secret: false,
    permissionLevel: 1,
    minArgs: 1,
    maxArgs: 2,
    aliases: [],
    run: liteMute
  },
  {
    name: 'unlitemute',
    description: 'Manually un-litemutes an user',
    examples: ['unlitemute @Sky Aviatour#3415'],
    secret: false,
    permissionLevel: 1,
    minArgs: 1,
    maxArgs: 1,
    run: unLiteMute
  }
]

export const jobs = [
  {
    period: 5, // In seconds
    job: checkLiteMutes
  }
]

export const events = [
  {
    trigger: 'guildMemberAdd',
    event: newcomerLiteMuteCheck
  },
  {
    trigger: 'guildMemberUpdate',
    event: processManualLiteMute
  },
  {
    trigger: 'guildBanAdd',
    event: removeLiteMuteFromBannedUser
  }
]
