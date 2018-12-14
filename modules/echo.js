module.exports = {
  name: 'echo',
  commands: [
    {
      name: 'echo',
      secret: false, // optional, default false unless permissionLevel is 3, then it's true
      description: 'Takes your input and spits it right back at you.', // required if not secret
      examples: ['yes'], // required if not secret
      permissionLevel: 0, // optional, default 0 | 0: anyone, 1: server mods, 2: server admins, 3: bot admins
      aliases: [], // optional
      cooldown: 0, // optional, default 0
      minArgs: 1, // required
      maxArgs: Infinity, // required
      run: async (message, args) => {
        let out = args.join(' ')
        try {
          return await message.channel.send(out)
        } catch (e) {
          if (e.message === 'Cannot send an empty message') return message.channel.send('\u200e')
          else throw e
        }
      }
    }
  ]
}
