import { Message } from 'discord.js'
import { loadModule as loadKernelModule } from '../scepter'

const loadModule = async (message: Message, args: string[]) => {
  args.forEach(loadKernelModule)
}

export const name = 'runtime modules'
export const commands = [
  {
    name: 'loadmod',
    description: 'Attempts to load an available module',
    examples: ['loadmod echo'],
    minArgs: 1,
    run: loadModule
  }
]
