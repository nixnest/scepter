module.exports = {
  name: 'echo',
  commands: [
    {
      name: 'joinmessage',
      description: 'Sets the join message where {} is replaced with the user ping. If a message without a {} is supplied, join messages are turned off.',
      examples: ['{} has joined the server', 'disable'],
      secret: false,
      permissionLevel: 2,
      aliases: ['joinmsg'],
      minArgs: 1,
      maxArgs: 1,
      run: async (message, args) => {
        return message.channel.send(args.join(' '))
      }
    }
  ],
  events: [
    {
      trigger: 'guildMemberAdd',
      run: async (member) => {
      }
    }
  ]
}
