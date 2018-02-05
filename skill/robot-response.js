"use strict";

const debug = require("debug")("bot-express:skill");

module.exports = class SkillRobotResponse {
    constructor(){
        this.clear_context_on_finish = (process.env.BOT_EXPRESS_ENV === "test") ? false : true;
    }

    finish(bot, event, context, resolve, reject){
        debug(`Going to reply "${context.intent.text_response}".`);
        let message = {
            text: context.intent.text_response
        };
        return bot.reply(message).then((response) => {
            return resolve();
        });
    }
}
