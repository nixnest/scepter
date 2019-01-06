'use strict'

export const log = async options => {
  if (options.logToConsole !== false) {
    console.log(`${options.type.toUpperCase()}: ${options.message}`)
  }
  if (options.client) {
    if (options.client.botGuild.available) {
      const logChannel = await options.client.botGuild.channels.find(val => val.name === 'log')
      if (!logChannel) {
        warn('No channel named #log in bot guild, failed to log message to Discord.')
      } else {
        logChannel.send(`${options.type.toUpperCase()}: ${options.message}`)
      }
    } else {
      error(`Guild ${options.client.botGuild} is not available.`)
    }
  }
}

export const info = (message, client?) => {
  // tslint:disable-next-line
  log({ type: 'Info', message, client })
}

export const warn = (message, client?) => {
  // tslint:disable-next-line
  log({ type: 'Warning', message, client })
}

export const error = (message, client?) => {
  // tslint:disable-next-line
  log({ type: 'Error', message, client })
  throw new Error(message)
}
