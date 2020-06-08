module.exports = {
    
    'command': 'voteban',

    'verify': function(ctx) {

        let is_admin = async (user_id) => {
            const admins = await ctx.getChatAdministrators()
            return admins.find((member) => member.user.id === user_id ) !== undefined;
        }

        if(!('reply_to_message' in ctx.message)) {
            ctx.replyError('Вы должны ответить на сообщение юзера, которого хотите забанить.')
            return false;
        }

        let user_id = ctx.message.from.id;
        if(!is_admin(user_id)) {
            ctx.replyError('Только администратор может создать голосование на бан.')
            return false;
        }

        return true;
    },

    'text': function(ctx) {
        
        let username = ctx.message.reply_to_message.from.username;
        ctx.state.username = username;
        
        return `Баним @${username}?`
    },
    
    'duration': 15,

    'is_anonymous': true,

    'answers': [
        { 
            'text': 'Да', 
            'handler': function (ctx) {

                let chat_id = ctx.message.chat.id;
                let user_id = ctx.message.reply_to_message.from.id;
                
                ctx.telegram.kickChatMember(
                    chat_id,    
                    user_id
                )

                ctx.replyBot(`@${ctx.state.username} уходит в бан.`);
            }
        },

        { 
            'text': 'Нет', 
            'handler': function(ctx) {
                ctx.replyBot(`@${ctx.state.username} может жить.`);
            }
        },
    ]
}