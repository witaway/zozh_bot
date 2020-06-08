const Telegraf = require('telegraf')
 
const bot = new Telegraf("1247355115:AAFn1oFsJbYm6SO1UlZXyZtAeC3gFH1unrs")
 

 
bot.command('ban', async (ctx) => {
    let user = ctx.message.reply_to_message.from.id;
    let chat = ctx.message.chat.id;
    
    await ctx.telegram.kickChatMember(
        chat_id = chat,    //"@zdesohuenniezhopy",
        user_id = user,
    )

    ctx.reply("Я только что забанил" + " " + user + " " + "В чате" + " " + chat)

})

bot.command('unban', async (ctx) => {
    let user = ctx.message.reply_to_message.from.id;
    let chat = ctx.message.chat.id;
    
    await ctx.telegram.unbanChatMember(
        chat_id = chat,   
        user_id = user,
    )

    ctx.reply("Я только что разбанил" + " " + user + " " + "В чате" + " " + chat)

})

bot.launch(console.log("bot start"))