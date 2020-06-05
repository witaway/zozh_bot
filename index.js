const Telegraf = require('telegraf')

const PollManager = require('./poll_manager')
const CommandArgsMiddleware = require('./command_parser')

const bot = new Telegraf("1075485707:AAGBLq-WgMoGaJAmpJK9Y4JEtW8IVbDpt_U")

bot.use(CommandArgsMiddleware())
bot.use(PollManager('./polls'))

bot.launch(console.log("bot start"))