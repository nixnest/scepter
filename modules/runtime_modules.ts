import { Message } from 'discord.js'
import { loadModule, unloadModule } from '../scepter'

const loadModules = async (message: Message, args: string[]) => {
  args.forEach(loadModule)
}

const unloadModules = async (message: Message, args: string[]) => {
  args.forEach(unloadModule)
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
