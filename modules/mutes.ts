import { Client, Guild, GuildMember, Role, Message, User } from 'discord.js'

import * as log from '../lib/log'

const _getGuildMutesRole = async (guild: Guild): Promise<Role> => {
  let role = guild.client['guildData'].get(`${guild.id}.mutedRole`)
  if (role == null) {
    role = guild.roles.find(x => x.name === 'muted')
    if (role == null) {
      throw new Error('No mutes role set and a default role could not be found.')
    }
  }
  return role
}

const _removeMemberFromMutes = async (client: Client, muteId: string) => {
  await client['timerData'].delete(muteId)
}

const checkMutes = async (client: Client) => {
  let curDate = new Date()
  let clientGuild: Guild
  let guildMember: GuildMember
  let clientGuildId: string
  let guildMemberId: string
  let muteRole: Role

  for (let entry of client['timerData'].entries()) {
    if (entry[1] === Infinity) continue
    if (curDate > entry[1]) {
      // Unmute the user
      [clientGuildId, guildMemberId] = entry[0].split('.')
      clientGuild = client.guilds.get(clientGuildId)

      try {
        guildMember = await clientGuild.fetchMember(guildMemberId)
      } catch (e) {
        await _removeMemberFromMutes(client, `${clientGuild.id}.${guildMemberId}`)
        continue
      }

      try {
        muteRole = await _getGuildMutesRole(clientGuild)
      } catch (e) {
        log.warn(e)
        continue
      }

      try {
        await guildMember.removeRole(muteRole)
      } catch (e) {
        log.warn(`${name}.job: ${e}`)
        return
      }

      delete client['timerData'][entry[0]]
    }
  }
}

const setMutedRole = async (message: Message, args: string[]) => {
  const roleId = args[0]
  const roleName = message.guild.roles.get(roleId)
  let returnMessage: String
  if (roleName) {
    await message.client['guildData'].set(`${message.guild.id}.mutedRole`, roleId)
    returnMessage = `Role ${roleName} has been set as the muted role.`
  } else {
    returnMessage = `That role does not exist, dummy.`
  }
  return message.channel.send(returnMessage)
}

const mute = async (message: Message, args: string[]) => {
  const muteTargetId = message.mentions.users.first().id
  const curDate = new Date()
  const mutePeriod = args[1]
    ? new Date(curDate.setSeconds(curDate.getSeconds() + parseInt(args[1], 10)))
    : Infinity
  const muteRole: Role = await _getGuildMutesRole(message.guild)
  const muteTarget: GuildMember = await message.guild.fetchMember(muteTargetId)

  try {
    await muteTarget.addRole(muteRole)
  } catch {
    return message.channel.send("I don't have permission to manage roles!")
  }
  await message.client['timerData'].set(`${message.guild.id}.${muteTargetId}`, mutePeriod)

  const mutePeriodText = mutePeriod === Infinity ? 'indefinitely' : `for ${args[1]} seconds`
  return message.channel.send(`User ${args[0]} has been muted ${mutePeriodText}.`)
}

const unmute = async (message: Message, args: string[]) => {
  const muteTargetId = message.mentions.users.first().id
  const muteRole = await _getGuildMutesRole(message.guild)
  const muteTarget = await message.guild.fetchMember(muteTargetId)

  try {
    await muteTarget.removeRole(muteRole)
  } catch {
    return message.channel.send("I don't have permission to manage roles!")
  }

  message.client['timerData'].delete(`${message.guild.id}.${muteTargetId}`)
  return message.channel.send(`User ${args[0]} has been unmuted.`)
}

const newcomerMuteCheck = async (member: GuildMember) => {
  const muteRole = await _getGuildMutesRole(member.guild)
  if (member.client['timerData'].has(`${member.guild.id}.${member.id}`)) {
    try {
      await member.addRole(muteRole)
    } catch (e) {
      log.warn(`${name}.newcomerMuteCheck: ${e}`)
      return
    }
  }
}

const processManualMute = async (previous: GuildMember, actual: GuildMember) => {
  let muteRole: Role | null

  try {
    muteRole = await _getGuildMutesRole(actual.guild)
  } catch (e) {
    log.warn(e)
    return
  }

  const isListed = actual.client['timerData'].has(`${actual.guild.id}.${actual.id}`)
  const hadRole = previous.roles.has(muteRole.id)
  const hasRole = actual.roles.has(muteRole.id)

  if (!isListed && !hadRole && hasRole) {
    await actual.client['timerData'].set(`${actual.guild.id}.${actual.id}`, Infinity)
  }
  if (isListed && hadRole && !hasRole) {
    await actual.client['timerData'].delete(`${actual.guild.id}.${actual.id}`)
  }
}

const removeMuteFromBannedUser = async (guild: Guild, user: User) => {
  return _removeMemberFromMutes(guild.client, `${guild.id}.${user.id}`)
}

export const name = 'mute'
export const commands = [
  {
    name: 'setmutedrole',
    description: 'Sets the given role ID to use as the mute role',
    examples: ['setmutedrole 522963469046120479'],
    secret: false,
    permissionLevel: 2,
    minArgs: 1,
    maxArgs: 1,
    aliases: [],
    run: setMutedRole
  },
  {
    name: 'mute',
    description: 'Mutes an user indefinitely or for a period of time',
    examples: ['mute @Sky Aviatour#3415'],
    secret: false,
    permissionLevel: 1,
    minArgs: 1,
    maxArgs: 2,
    aliases: [],
    run: mute
  },
  {
    name: 'unmute',
    description: 'Manually unmutes an user',
    examples: ['unmute @Sky Aviatour#3415'],
    secret: false,
    permissionLevel: 1,
    minArgs: 1,
    maxArgs: 1,
    run: unmute
  }
]

export const jobs = [
  {
    period: 5, // In seconds
    job: checkMutes
  }
]

export const events = [
  {
    trigger: 'guildMemberAdd',
    event: newcomerMuteCheck
  },
  {
    trigger: 'guildMemberUpdate',
    event: processManualMute
  },
  {
    trigger: 'guildBanAdd',
    event: removeMuteFromBannedUser
  }
]
