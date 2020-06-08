const Telegraf = require('telegraf')

const PollManager = require('./poll_manager')
const CommandArgsMiddleware = require('./command_parser')

const bot = new Telegraf("1075485707:AAGBLq-WgMoGaJAmpJK9Y4JEtW8IVbDpt_U")

let manager = new PollManager.Manager('./modules');

///Add ctx.replyBot (italian) and ctx.replyError (bold)
bot.use((ctx, next) => {
    ctx.replyBot = (text) => {
        text = text.replace('.', '\\.');
        text = text.replace('-', '\\-');
        ctx.replyWithMarkdownV2(`_${text}_`);
    }
    ctx.replyError = (text) => {
        text = text.replace('.', '\\.');
        text = text.replace('-', '\\-');
        ctx.replyWithMarkdownV2(`*_${text}_*`);    
    }
    next();
}) 
bot.use(CommandArgsMiddleware());
bot.use(PollManager.middleware(manager));

bot.command('stopvote', (ctx) => {

    let is_admin = async (user_id) => {
        const admins = await ctx.getChatAdministrators()
        return admins.find((member) => member.user.id === user_id ) !== undefined;
    }

    if(!('reply_to_message' in ctx.message)) {
        ctx.replyError('Вы должны переслать опрос, который надо остановить.')
        return;
    }

    if(!('poll' in ctx.message.reply_to_message)) {
        ctx.replyError('То, что вы переслали - не опрос.');
        return;
    }

    let user_id = ctx.message.from.id;
    let poll_id = ctx.message.reply_to_message.poll.id;
    
    if(is_admin(user_id)) {
        try {
            clearTimeout(manager.poll_timeouts[poll_id]);
            delete manager.poll_timeouts[poll_id];
            delete manager.poll_best_answer[poll_id]
            ctx.replyBot('Опрос отменён.')
        } catch(e) {
            ctx.replyError(e);
        }
    } else {
        ctx.replyError('Отменить голосование может только администратор.');
    }

})

bot.command('unban', (ctx) => {
    let is_admin = async (user_id) => {
        const admins = await ctx.getChatAdministrators()
        return admins.find((member) => member.user.id === user_id ) !== undefined;
    }

    if(!('reply_to_message' in ctx.message)) {
        ctx.replyError('Вы должны переслать сообщение человека, которого надо разбанить.')
        return;
    }

    let user_id = ctx.message.from.id;
    let chat_id = ctx.message.chat.id;
    let reply_id = ctx.message.reply_to_message.from.id;
    

    if(is_admin(user_id)) {
        ctx.telegram.unbanChatMember(
            chat_id,
            reply_id
        );
        ctx.replyBot('Бан отменён.');
    } else {
        ctx.replyError('Только администратор может отменить бан.');
    }
})

bot.launch(console.log("bot start"))