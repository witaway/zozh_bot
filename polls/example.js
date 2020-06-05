/*

На данный момент у модуля есть поля: 

command       (string)
verify        (function)

text          (string)
duration      (number)
is_anonymous  (boolean)
answers       (object - массив)

(1) Все поля у модуля должны либо иметь тип, указанный выше, либо быть функциями, которые возвращают тип, указанный выше.
Это позволяет нам делать динамический текст у опроса, к примеру. Или динамическое время у опроса.
Если поле не соответствует этому критерию - код выдаёт исключение.

(2)
! У каждой функции есть доступ к ctx, как к первому аргументу.
! Это даёт много возможностей: например, можно узнать имя пользователя, которого мы хотим забанить.  
Это можно реализовать через reply_to_message.

(3)
Исключения из правила (1): поле command и поле verify. 
Command всегда строка - название команды, по которому модуль сработает. 
Verify всегда функция - она проверяет, всё ли хорошо в контексте. Например, нам могут ввести неправильные аргументы, которые сломают программу.
Verify возвращает либо true - продолжить выполнение команды, либо false - прервать.
Verify так же имеет доступ к ctx. С помощью него можно, например, вывести в чат сообщение об ошибке.

(4) Также ctx очень удобная штука. Помимо информации о сообщении и доступа к апи, там можно хранить важную временную информацию.
Для этого в Telegraf предусмотрено поле ctx.state; Пример: ctx.state.username = 'tkus'
Но на самом деле, лучше стараться обходиться без этой фичи, хоть она и работает хорошо.
*/

//-----

module.exports = {
    
    'command': 'testPoll',

    //Достаточно полный пример, как может использоваться чекер
    'verify': function(ctx) {

        let args = ctx.state.command.args;

        if(!('reply_to_message' in ctx.message)) {
            ctx.reply('You must reply the message of user.')
            return false;
        }

        if(args.length !== 2) {
            ctx.reply('Command voteban must have 2 arguments')
            return false;
        }

        if(isNaN(Number(args[0]))) {
            ctx.reply('First argument must be a number!')
            return false;
        }

        if(!(['seconds', 'minutes', 'hours', 'days'].includes(args[1]))) {
            ctx.reply('Second argument must be seconds/minutes/hours/days');
            return false;
        }

        return true;
    },

    //Динамически генерирует текст опроса и сохраняет имя пользователя в ctx.state - именно то, о чём я говорил выше.
    'text': function(ctx) {
        
        let args = ctx.state.command.args;
        let username = ctx.message.reply_to_message.from.username;
        ctx.state.username = username;
        
        return `Wanna ban ${username} (args: ${args.join(' ')})?`
    },
    
    'duration': 15,

    'is_anonymous': true,

    //Здесь всё понятно. Также стоит отметить, что здесь мы уже забираем сохранённую инфу из ctx.state
    //Это удобно, но это плохой подход. Лучше так не делать. ;)
    'answers': [
        { 
            'text': 'Yes', 
            'handler': function(ctx) {
                ctx.reply(`I will ban ${ctx.state.username}`);
            }
        },

        { 
            'text': 'No', 
            'handler': function(ctx) {
                ctx.reply(`I will NOT ban ${ctx.state.username}`);
            }
        },
    ]
}