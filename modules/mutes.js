let setMutedRole = async (message, args) => {
  let roleId = args[0]
  let guild = message.client.guilds.get(process.env.BOT_GUILD)
  let roleName = guild.roles.get(roleId)
  let returnMessage
  if (roleName) {
    message.client.guildData.get(process.env.BOT_GUILD).mutedRole = roleId
    returnMessage = `Role ${roleName} has been set as the muted role.`
  } else {
    returnMessage = `That role does not exist dummy.`
  }
  return message.channel.send(returnMessage)
}

let mute = async (message, args) => {

}

module.exports = {
  name: 'mute',
  commands: [
    {
      name: 'setmutedrole',
      description: 'Sets the role to use as the mute role',
      examples: ['setmutedrole yeet'],
      secret: true,
      permissionLevel: 2,
      aliases: [],
      cooldown: 0,
      minArgs: 1,
      maxArgs: 1,
      run: setMutedRole
    },
    {
      name: 'mute',
      description: 'Mutes an user indefinitely or for a period of time',
      examples: ['mute @Sky Aviatour#3415'],
      secret: false,
      permissionLevel: 1,
      aliases: [],
      cooldown: 0,
      minArgs: 1,
      maxArgs: 2,
      run: mute
    }
  ]
}