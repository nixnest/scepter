'use strict'

const log = async options => {
  if (options.logToConsole !== false) {
    console.log(`${options.type.toUpperCase()}: ${options.message}`)
  }
  if (options.client) {
    if (options.client.botGuild.available) {
      let logChannel = await options.client.botGuild.channels.find(val => val.name === 'log')
      if (!logChannel) {
        exports.warn('No channel named #log in bot guild, failed to log message to Discord.')
      } else {
        logChannel.send(`${options.type.toUpperCase()}: ${options.message}`)
      }
    } else {
      exports.error(`Guild ${options.client.botGuild} is not available.`)
    }
  }
}

exports.info = (message, client) => {
  log({ type: 'Info', message, client })
}

exports.warn = (message, client) => {
  log({ type: 'Warning', message, client })
}

exports.error = (message, client) => {
  log({ type: 'Error', message, client })
  throw new Error(message)
}
