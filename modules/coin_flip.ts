import { Message } from 'discord.js'

export const name = 'coin flip'
export const commands = [
  {
    name: 'flip',
    secret: false,
    description: 'Flips a coin',
    examples: ['!flip => Tails'],
    minArgs: 0,
    run: async (message: Message) => {
      let flip: string = flipC() + '!'
      try {
        return await message.reply(flip)
      } catch (e) {
        throw e
      }
    }
  }
]

// returns a random "Heads" or "Tails"
function flipC(): string {
  let random: number = Math.round(Math.random())
  if (random === 1) {
    return 'Heads'
  } else {
    return 'Tails'
  }
}