import { Message, Role, Client, Guild } from 'discord.js'

const HEX_COLOUR_REGEX = new RegExp('^#?[0-9a-f]{6}$')

const setColourRole = async (message: Message, args: string[]) => {
  let hexColour: string = args[0]
  if (!HEX_COLOUR_REGEX.test(hexColour)) {
    return message.channel.send(`${hexColour} is not a valid colour for a role!`)
  }
  if (message.member.roles.map(x => x.name).includes(hexColour)) {
    return message.channel.send('You already have that colour!')
  }
  if (hexColour.length > 6) {
    hexColour = hexColour.slice(1, 7)  // remove the pound sign
  }
  message.member.roles.filter(x => HEX_COLOUR_REGEX.test(x.name))
        .forEach(role => message.member.removeRole(role))
  const currentRoles: Role[] = message.client['guildData'].get(`${message.guild.id}.roles`)
  let colourRole = currentRoles.find(x => x.name === hexColour)
  if (colourRole == null) {
    colourRole = await message.guild.createRole({
      name: hexColour,
      color: `#${hexColour}`
    })
    message.client['guildData'].set(
      `${message.guild.id}.roles`, currentRoles.concat(colourRole)
    )
  }
  await message.member.addRole(colourRole)

}

const refreshRoleCache = async (client: Client) => {
  let clientGuild: Guild
  for (let guild of client.guilds) {
    clientGuild = guild[1]
    client['guildData'].set(`${clientGuild.id}.roles`, [...clientGuild.roles.values()])
  }
}

export const name = 'colour roles'
export const loadOnBoot = false
export const commands = [
  {
    name: 'setcolour',
    aliases: ['setcolor'],
    description: 'Self-assign a colour role',
    minArgs: 1,
    maxArgs: 1,
    run: setColourRole
  }
]
export const jobs = [
  {
    period: 3600,
    runInstantly: true,
    job: refreshRoleCache
  }
]
