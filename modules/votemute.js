module.exports = {

    'command': 'votemute',

    'verify': function (ctx) {

        let args = ctx.state.command.args;

        if (!('reply_to_message' in ctx.message)) {
            ctx.replyError('Вы должны ответить на сообщение юзера, которого хотите замутить.')
            return false;
        }

        if (args.length !== 2 && args.length !== 0) {
            ctx.replyError('Команда votemute должна иметь либо два аргумента, либо не иметь их вовсе (в таком случае, мут по умолчанию на 30 минут).')
            return false;
        }

        if (args.length == 2 && isNaN(Number(args[0]))) {
            ctx.replyError('Первый аргумент должен быть числом.')
            return false;
        }

        if (args.length == 2 && !(['sec', 'min', 'hour', 'day'].includes(args[1]))) {
            ctx.replyError('Второй аргумент должен быть sec/min/hour/day.');
            return false;
        }

        let ban_time = Number(args[0])
        let unit = args[1]

        if (unit == 'sec') ban_time *= 1;
        if (unit == 'min') ban_time *= 60;
        if (unit == 'hour') ban_time *= (60 * 60);
        if (unit == 'day') ban_time *= (60 * 60 * 24);

        if (ban_time < 30 || ban_time > (60 * 60 * 24 * 365)) {
            ctx.replyError('Человека нельзя замьютить меньше, чем на 30 секунд или больше, чем на 1 год.');
            return false;
        }

        return true;
    },

    'text': function (ctx) {

        let args = ctx.state.command.args;
        let username = ctx.message.reply_to_message.from.username;
        ctx.state.username = username;

        if (args.length === 0) {
            args.push(30);
            args.push('min');
        }

        let time_to_str = require('../time_to_str');
        let mute_time_str = time_to_str(Number(args[0]), args[1])

        return `Мутим @${username} на ${mute_time_str}?`
    },

    'duration': 15,

    'is_anonymous': true,

    'answers': [{
            'text': 'Да',
            'handler': function (ctx) {

                let args = ctx.state.command.args;
                
                let chat_id = ctx.message.chat.id;
                let user_id = ctx.message.reply_to_message.from.id;

                let add_time = Number(args[0])
                let unit = args[1]

                if (unit == 'sec') add_time *= 1;
                if (unit == 'min') add_time *= 60;
                if (unit == 'hour') add_time *= (60 * 60);
                if (unit == 'day') add_time *= (60 * 60 * 24);

                let cur_time = Math.round(Date.now() / 1000);

                ctx.telegram.restrictChatMember(
                    chat_id,
                    user_id, {
                        permissions: {
                            can_send_messages: false,
                        },
                        until_date: cur_time + add_time
                    },
                );

                let time_to_str = require('../time_to_str');
                let mute_time_str = time_to_str(Number(args[0]), args[1])

                ctx.replyBot(`@${ctx.state.username} уходит в мут на ${mute_time_str}.`);
            }
        },

        {
            'text': 'Нет',
            'handler': function (ctx) {
                ctx.replyBot(`@${ctx.state.username} не будет замучен.`);
            }
        },
    ]
}