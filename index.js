const Telegraf = require('telegraf')

const PollManager = require('./poll_manager')
const CommandArgsMiddleware = require('./command_parser')

const bot = new Telegraf("1075485707:AAGBLq-WgMoGaJAmpJK9Y4JEtW8IVbDpt_U")

let manager = new PollManager.Manager('./modules');
let mailinglist = [];

let slashify = (text_x) => {
    let text = text_x.split('.').join('\\.');
    text = text.split('-').join('\\-');
    text = text.split('_').join('\\_');
    text = text.split('!').join('\\!');
    text = text.split('*').join('\\*');
    text = text.split('(').join('\\(');
    text = text.split(')').join('\\)');
    text = text.split('{').join('\\{');
    text = text.split('}').join('\\}');
    return text;
}

///Add ctx.replyBot (italian), ctx.replyError (bold), is_admin functions and add mailing_list
bot.use((ctx, next) => {

    ctx.replyBot = (text) => {
        console.log(`reply: ${text}`);
        text = slashify(text)
        ctx.replyWithMarkdownV2(`_${text}_`);
    }

    ctx.replyError = (text) => {
        console.log(`error: ${text}`);
        text = slashify(text);
        ctx.replyWithMarkdownV2(`*_${text}_*`);    
    }

    let is_admin = async (user_id) => {
        const admins = await ctx.getChatAdministrators()
        return admins.find((member) => member.user.id === user_id ) !== undefined;
    }
    ctx.is_admin = is_admin;

    ctx.state.mailinglist = mailinglist;

    next();
}) 

bot.use((ctx, next) => {
    ctx.log = (type, text_x) => {

        let text = slashify(text_x);
        console.log(`LOG_${type}: ${text}`);
        ctx.state.mailinglist.forEach((chat_id) => {
            if(type.toLowerCase() === 'error') {
                ctx.telegram.sendMessage(chat_id, `*_${text}_*`, {
                    parse_mode: 'MarkdownV2'
                })
            } else
            if(type.toLowerCase() === 'log') {
                ctx.telegram.sendMessage(chat_id, `_${text}_`, {
                    parse_mode: 'MarkdownV2'
                })
            }
        })
    }
    next();
});

bot.use(CommandArgsMiddleware());
bot.use(PollManager.middleware(manager));

bot.command('subscribe', (ctx) => {
    let chat_id = ctx.message.chat.id;
    if(ctx.message.chat.type === 'private') {
        if(ctx.state.mailinglist.includes(chat_id)) {
            ctx.reply('You\'re already subscrubed.');
            return;
        }
        ctx.state.mailinglist.push(chat_id);
        ctx.reply('Subscribed successfully!');
    }
})

bot.command('unsubscribe', (ctx) => {
    let chat_id = ctx.message.chat.id;
    if(ctx.message.chat.type === 'private') {
        if(!ctx.state.mailinglist.includes(chat_id)) {
            ctx.reply('You\'re already NOT subscrubed.');
            return;
        }
        ctx.state.mailinglist.pop(chat_id);
        ctx.reply('Unsubscribed successfully!');
    }
})

bot.command('stopvote', async (ctx) => {
    try {

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
        
        if(await ctx.is_admin(user_id)) {
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
    } catch(e) {
        ctx.log('Error', `Exception: ${e}`);
        ctx.log('Error', `Command: stopvote, user: @${ctx.message.from.username}, message: ${ctx.message.text}`);
        ctx.replyError('Неизвестная ошибка. Подробные сведения переданы администраторам.');
    }
})


bot.command('revoke_ban', async (ctx) => {
    try {

        if(!('reply_to_message' in ctx.message)) {
            ctx.replyError('Вы должны переслать сообщение человека, которого надо разбанить.')
            return;
        }

        let user_id = ctx.message.from.id;
        let chat_id = ctx.message.chat.id;
        let reply_id = ctx.message.reply_to_message.from.id;
        

        if(await ctx.is_admin(user_id)) {
            let member_info = await ctx.telegram.getChatMember(chat_id, reply_id);
            if(member_info.status === 'kicked') {
                ctx.telegram.unbanChatMember(
                    chat_id,
                    reply_id
                );
                ctx.replyBot('Бан отменён.');
            } else {
                ctx.replyError('Пользователь не забанен.');
            }
        } else {
            ctx.replyError('Только администратор может отменить бан.');
        }
    } catch(e) {
        ctx.log('Error', `Exception: ${e}`);
        ctx.log('Error', `Command: revoke_ban, user: @${ctx.message.from.username}, message: ${ctx.message.text}`);
        ctx.replyError('Неизвестная ошибка. Подробные сведения переданы администраторам.');
    }
})

bot.command('exception', (ctx) => {
    try {
        throw "TEST ERROR!";
    } catch (e) {
        ctx.log('Error', `Exception: ${e}`);
        ctx.log('Error', `Command: revoke_ban, user: @${ctx.message.from.username}, message: ${ctx.message.text}`);
        ctx.replyError('Неизвестная ошибка. Подробные сведения переданы администраторам.');
    }
})

bot.launch(console.log("bot start"))