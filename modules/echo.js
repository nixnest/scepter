module.exports = {
  name: 'echo',
  commands: [
    {
      name: 'echo',
      secret: false, // optional, default false
      description: 'Takes your input and spits it right back at you.', // required if not secret
      examples: ['yes'], // required if not secret
      permissionLevel: 0, // optional, default 0
                          // 0: anyone, 1: server mods, 2: server admins, 3: bot admins
      aliases: [], // optional
      cooldown: 0, // optional, default 0
      minArgs: 1, // required
      maxArgs: Infinity, // required
      run: async (message, args) => {
        return message.channel.send(args.join(' '))
      }
    }
  ]
}
