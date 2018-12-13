module.exports = {
  name: 'echo',
  commands: [
    {
      name: 'echo',
      description: 'Takes your input and spits it right back at you.',
      examples: ['echo yes'],
      secret: false,
      permissionLevel: 0, // 0: anyone, 1: server admins, 2: bot admins
      aliases: [],
      cooldown: 0, // per user not server
      minArgs: 1,
      maxArgs: Infinity,
      run: async (message, args) => {
        return message.channel.send(args.join(' '))
      }
    }
  ]
}
