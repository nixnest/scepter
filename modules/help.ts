import { Message } from 'discord.js'
import { Command } from '../scepter'

export const help = async (message: Message, args: string[]) => {
  const helpCommand = args[0]
  const command: Command = message.client['loadedCommands'][helpCommand]

  if (command == null) {
    return message.channel.send(`Command not found: ${helpCommand}`)
  }
  return message.channel.send(`${helpCommand}: ${command.description}\n\
Examples: \`${command.examples.map(x => x)}\``)
}

export const name = 'help'
export const commands = [
  {
    name: 'help',
    description: 'Shows info and usage details of a given command',
    examples: ['s.help help'],
    minArgs: 1,
    maxArgs: 1,
    run: help
  }
]
