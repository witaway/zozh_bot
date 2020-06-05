module.exports = function() {
    this.bot.command('hi', (ctx) => {
        ctx.reply('Hi!');
    })
}