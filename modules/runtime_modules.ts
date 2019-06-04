import { Message } from 'discord.js'
import { loadModule, unloadModule, availableModules } from '../scepter'

const loadModules = async (message: Message, args: string[]) => {
  args.forEach(async (module: string) => {
    if (!availableModules.includes(module)) {
      await message.channel.send(`Module ${module} does not exist!`)
      return
    }

    if (Object.keys(message.client['loadedModules']).includes(module)) {
      await message.channel.send(`Module ${module} is already loaded. Not doing anything.`)
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

    if (!Object.keys(message.client['loadedModules']).includes(module)) {
      await message.channel.send(`Module ${module} is already unloaded. Not doing anything.`)
      return
    }
    unloadModule(module)
    await message.channel.send(`Module ${module} has been unloaded.`)
  })
}

const listModules = async (message: Message, _) => {
  await message.channel.send(`List of available modules:\n**${availableModules.join(', ')}**`)
}

export const name = 'runtime modules'
export const commands = [
  {
    name: 'loadmod',
    description: 'Attempts to load an available module',
    examples: ['loadmod echo'],
    minArgs: 1,
    permissionLevel: 3,
    aliases: ['modprobe'],
    run: loadModules
  },
  {
    name: 'unloadmod',
    description: 'Attempts to deactivate a loaded module',
    examples: ['unloadmod echo'],
    minArgs: 1,
    permissionLevel: 3,
    aliases: ['rmmod'],
    run: unloadModules
  },
  {
    name: 'listmods',
    description: 'Displays all available modules',
    examples: ['lsmod'],
    permissionLevel: 3,
    aliases: ['lsmod'],
    maxArgs: 0,
    run: listModules
  }
]
