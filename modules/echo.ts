import { Message } from 'discord.js'

export const name = 'echo'
export const commands = [
  {
    name: 'echo',
    secret: false,
    description: 'Takes your input and spits it right back at you.', // required if not secret
    examples: ['yes'], // required if not secret
    aliases: [], // optional
    cooldown: 0, // optional, default 0
    minArgs: 1, // required
    maxArgs: Infinity, // required
    run: async (message: Message, args: string[]) => {
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
