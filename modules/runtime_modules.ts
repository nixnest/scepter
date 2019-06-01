import { Message } from 'discord.js'
import { loadModule, unloadModule, availableModules } from '../scepter'

const loadModules = async (message: Message, args: string[]) => {
  args.forEach(async (module: string) => {
    if (!availableModules.includes(module)) {
      await message.channel.send(`Module ${module} does not exist!`)
      return
    }
    loadModule(module)
    await message.channel.send(`Module ${module} is now available.`)
  })
}

const unloadModules = async (message: Message, args: string[]) => {
  args.forEach(async (module: string) => {
    if (!availableModules.includes(module)) {
      await message.channel.send(`Module ${module} does not exist!`)
      return
    }
    unloadModule(module)
    await message.channel.send(`Module ${module} has been unloaded.`)
  })
}

export const name = 'runtime modules'
export const commands = [
  {
    name: 'loadmod',
    description: 'Attempts to load an available module',
    examples: ['loadmod echo'],
    minArgs: 1,
    run: loadModules
  },
  {
    name: 'unloadmod',
    description: 'Attempts to deactivate a loaded module',
    exampled: ['unloadmod echo'],
    minArgs: 1,
    run: unloadModules
  }
]
