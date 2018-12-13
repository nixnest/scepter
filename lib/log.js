'use strict'

const log = async function (options) {
  if (options.logToConsole !== false) {
    console.log(`${options.type.toUpperCase()}: ${options.message}`)
  }
  if (options.client) {
    if (options.client.botGuild.available) {
      let logChannel = await options.client.botGuild.channels.find(val => val.name === 'log')
      if (!logChannel) {
        try {
          logChannel = await options.client.botGuild.createChannel('log')
        } catch (e) {
          if (e.message === 'Missing Permissions') {
            exports.warn('Cannot send log messages to Discord, no channel named #log and no Manage Channel permission on bot guild.')
          } else {
            exports.error(e)
          }
        }
      } else {
        logChannel.send(`${options.type.toUpperCase()}: ${options.message}`)
      }
    } else {
      exports.error(`Guild ${options.client.botGuild} is not available.`)
    }
  }
}

exports.info = function (message, client) {
  log({ type: 'Info', message, client })
}

exports.warn = function (message, client) {
  log({ type: 'Warning', message, client })
}

exports.error = function (message, client) {
  log({ type: 'Error', message, client })
  throw new Error(message)
}
