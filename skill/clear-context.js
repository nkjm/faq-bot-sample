"use strict";

// This skill is for test purpose only.
module.exports = class SkillClearContext {
    constructor(){
        this.clear_context_on_finish = true;
    }

    finish(bot, event, context, resolve, reject){
        return resolve();
    }
}
