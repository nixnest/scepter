# scepter
Spiritual successor to Nixbot

## Requirements
* Node >= 10.15
* [A Discord bot account](https://www.digitaltrends.com/gaming/how-to-make-a-discord-bot/)

## Contributing

* Clone the repo
* Install dependencies `npm i`
* Set up the required environment variables:

  * SCEPTER_BOT_GUILD: The bot's instance's main server, in which logging will occur
  * SCEPTER_DISCORD_TOKEN: The bot's token, as given to you by Discord's development site
  * SCEPTER_OWNER_IDS: A colon-separated list of user IDs with elevated permissions

* Make sure your changes pass the linter before submitting them

  * The repo's husky hook should take care of it, but just in case keep its checks in mind