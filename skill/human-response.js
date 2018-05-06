"use strict";

const debug = require("debug")("bot-express:skill");
const dialogflow = require("../service/dialogflow.js");
const parser = require("../service/parser");

module.exports = class SkillHumanResponse {

    constructor(){
        this.required_parameter = {
            user: {},
            question: {},
            answer: {
                message_to_confirm: {
                    type: "text",
                    text: "では回答をお願いします。"
                }
            },
            enable_learning: {
                message_to_confirm: {
                    type: "template",
                    altText: "このQ&AをChatbotに学習させますか？（はい・いいえ）",
                    template: {
                        type: "confirm",
                        text: "このQ&AをChatbotに学習させますか？",
                        actions: [
                            {type:"message", label:"はい", text:"はい"},
                            {type:"message", label:"いいえ", text:"いいえ"}
                        ]
                    }
                },
                parser: (value, bot, event, context, resolve, reject) => {
                    return parser.parse("yes_no", value, resolve, reject);
                },
                reaction: (error, value, bot, event, context, resolve, reject) => {
                    if (error) return resolve();
                    if (value === "いいえ") return resolve();

                    // Create new intent using question and add response using answer.
                    return dialogflow.add_intent({
                        name: context.confirmed.question,
                        training_phrase: context.confirmed.question,
                        action: "robot-response",
                        text_response: context.confirmed.answer
                    }).then((response) => {
                        bot.queue({
                            type: "text",
                            text: "では新規Q&Aとして追加しておきます。"
                        });
                        return resolve();
                    });

                    return resolve();
                }
            }
        }

        this.clear_context_on_finish = (process.env.BOT_EXPRESS_ENV === "test") ? false : true;
    }

    finish(bot, event, context, resolve, reject){
        // Promise List.
        let tasks = [];

        // ### Tasks Overview ###
        // -> Reply to administrator.
        // -> Send message to original user.

        // -> Reply to administrator.
        tasks.push(bot.reply({
            type: "text",
            text: "いただいた内容でユーザーへ返信しておきます。"
        }));

        // -> Reply to original user.
        tasks.push(bot.send(context.confirmed.user.id, {
            type: "text",
            text: context.confirmed.answer
        }, context.confirmed.user.language));

        return Promise.all(tasks).then((response) => {
            return resolve();
        });
    }
};
