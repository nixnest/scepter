let checkMutes = async (client) => {
  let mutedRole = async (guild) => {
    let role = client.guildData.get(`${guild.id}.mutedRole`)
    if (role == null) {
      role = guild.roles.find(x => x.name === 'mutes')
    }
    return role
  }

  let curDate = new Date();
  let clientGuild, guildMember, clientGuildId, guildMemberId
  for (let entry of client.timerData.entries()) {
    if (entry[1] === Infinity) continue
    if (curDate > entry[1]) {  // Unmute the user
      clientGuildId = entry[0].split('.')[0]
      guildMemberId = entry[0].split('.')[1]
      clientGuild = await client.guilds.get(clientGuildId)
      guildMember = await clientGuild.fetchMember(guildMemberId)
      mutedRole = await mutedRole(clientGuild)
      await guildMember.removeRole(mutedRole)
      delete client.timerData[entry[0]]
    }
  }
}

let setMutedRole = async (message, args) => {
  let roleId = args[0]
  let roleName = message.guild.roles.get(roleId)
  let returnMessage
  if (roleName) {
    await message.client.guildData.set(`${message.guild.id}.mutedRole`, roleId)
    returnMessage = `Role ${roleName} has been set as the muted role.`
  } else {
    returnMessage = `That role does not exist, dummy.`
  }
  return message.channel.send(returnMessage)
}

let mute = async (message, args) => {
  let muteTargetId = message.mentions.users.first().id
  let curDate = new Date()
  let mutePeriod = args[1]
    ? new Date(curDate.setSeconds(curDate.getSeconds() + parseInt(args[1])))
    : Infinity
  let muteRole = await message.client.guildData.get(`${message.guild.id}.mutedRole`)
  if (muteRole == null) {
    muteRole = message.guild.roles.find(r => r.name === 'mutes')
    if (muteRole == null) {
      return message.channel.send("You didn't set a mute role and I can't find a default one, dummy")
    }
  }
  let muteTarget = await message.guild.fetchMember(muteTargetId)
  muteTarget.addRole(muteRole)
  await message.client.timerData.set(`${message.guild.id}.${muteTargetId}`, mutePeriod)
  let mutePeriodText = mutePeriod === Infinity ? 'indefinitely' : `for ${args[1]} seconds`
  return message.channel.send(`User ${args[0]} has been muted ${mutePeriodText}.`)
}

module.exports = {
  name: 'mute',
  commands: [
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
    }
  ],
  jobs: [
    {
      period: 5,  // In seconds
      job: checkMutes
    }
  ]
}