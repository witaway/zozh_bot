//Makes PollManager and return middleware configured to work with this manager.
module.exports = (path) => {
    let manager = new PollManager(path);
    return middleware(manager);
}

/// Gives poll updates information to mager
/// And listens commands and giving it to the manager to execute.
let middleware = (manager) => {

    return (ctx, next) => {

        ///Message handling part
        if(ctx.updateType === 'message' && ctx.updateSubTypes.includes('text')) {
            if(ctx.message.text.startsWith('/')) {
                let text = ctx.message.text;
                let command = text.split(' ')[0].slice(1)
                if(manager.isCommandExist(command)) {
                    manager.executePoll(command, ctx);
                }
            }
        }

        ///Vote updates handling part
        if(ctx.updateType === 'poll') {
            manager.handlePollUpdate(ctx);
        }

        next();
    }
}

let PollManager = class {

    //Initialises this.poll_best_answer and this.modules
    //Also imports dir with modules if its given.
    constructor(path) {
        this.poll_best_answer = {}
        this.modules = {}
        if(path !== undefined) {
            this.importDirectory(path);
        }
    }

    isCommandExist(command) {
        return (command in this.modules)
    }

    //Executes command
    async executePoll(command, ctx) {
        
        //Helps get fields from module.
        //Return field named field
        //If its undefined - exception, if type of it is not stdtype - exception,
        //If it is not a function that returned stdtype - exception. (also gives ctx to these functions)
        let getVar = (module, field, stdtype) => {
            if(typeof(module[field]) == 'undefined') {
                throw `Field ${field} is undefined`
            } else 
            if(typeof(module[field]) == stdtype) {
                return module[field]
            } else
            if(typeof(module[field]) == 'function') {
                let ret = module[field](ctx)
                if(typeof(ret) == stdtype) {
                    return ret;
                } else {
                    throw `Function must return ${stdtype} type for ${field} field`;
                }
            }
        }

        let module = this.modules[command]

        //Verification
        let verify = getVar(module, 'verify', 'function');
        if(!verify(ctx)) {
            return;
        } 
            
        //Imports all fields from module
        let text         = getVar(module, 'text', 'string');
        let duration     = getVar(module, 'duration', 'number');
        let is_anonymous = getVar(module, 'is_anonymous', 'boolean');
        let answers      = getVar(module, 'answers', 'object');

        //Makes the list of choices (that we need to send to tg api)
        let choices = answers.reduce((accum, cur) => {
            accum.push(cur.text)
            return accum;
        }, []);

        //Sends poll
        let poll = await ctx.replyWithPoll(
             text,
             choices,
             { open_period: duration, is_anonymous: is_anonymous }
        );

        //Saves important temporary information about poll.
        let poll_id = poll.poll.id;
        this.poll_best_answer[poll_id] = { voter_count: 0 }
    
        //Listens while poll is opened and executes handler of best answer
        setTimeout(() => {
            
            let best_choice = this.poll_best_answer[poll_id].text;
            let best_votes  = this.poll_best_answer[poll_id].voter_count;
    
            if(best_votes == 0) {
                ctx.reply('No one person have voted. :(');
            } else {
                //Gives needed handler from answers
                let handler = answers.find((element) => element.text === best_choice).handler
                handler(ctx);
            }
            
            //We need to delete this information to prevent memory leak.
            //Javascript virtual will not delete this itself. 
            delete this.poll_best_answer[poll_id];
        
        }, 1000 * duration);
    }

    //Just saves the best answer of the poll of given update.
    //Attention! If you'll give not a poll update it will crush.
    handlePollUpdate(ctx) {
        
        if(ctx.updateType !== 'poll') {
            throw "Sent ctx MUST be a poll update!";
        }

        let best = ctx.poll.options.reduce(
            (accum, cur) => (cur.voter_count > accum.voter_count ? cur : accum),
            {voter_count: 0 }  
        )
       
        let poll_id = ctx.poll.id;
        this.poll_best_answer[poll_id] = best;
    }

    //Imports certain module from module_path
    importModule(module_path) {
        if(!module_path.startsWith('./') && !module_path.startsWith('.\\')) {
            module_path = './' + module_path;
        }
        let module = require(module_path)
        this.modules[module.command] = module;
    }

    //Imports all modules from directory
    importDirectory(dir_path) {
        
        const fs = require('fs');
        const path = require('path')

        fs.readdirSync(dir_path).forEach(file => {
            let module_name = file.split('.').slice(0, -1).join('.')
            let module_path = path.join('./', dir_path, module_name)
            this.importModule(module_path)
        });
    }

}