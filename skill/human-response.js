"use strict";

Promise = require("bluebird");
const debug = require("debug")("bot-express:skill");
const dialogflow = require("../service/dialogflow.js");
const parse = require("parser");
const SKIP_INTENT_LIST = ["Default Fallback Intent", "Default Welcome Intent", "escalation", "human-response", "robot-response"];

module.exports = class SkillHumanResponse {

    constructor(){
        this.required_parameter = {
            user_id: {},
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
                    return parse(context.sender_language, "yes_no", value, ["はい","いいえ"], resolve, reject);
                },
                reaction: (error, value, bot, event, context, resolve, reject) => {
                    if (error) return resolve();
                    if (value === "いいえ") return resolve();

                    // Ask if admin wants to create new intent or add this question to existing intent as new expression.
                    bot.collect("is_new_intent");
                    return resolve();
                }
            }
        }

        this.optional_parameter = {
            is_new_intent: {
                message_to_confirm: {
                    type: "template",
                    altText: "この質問は新しいQ&Aですか？あるいは既存のQ&Aですか？（新規・既存・わからない）",
                    template: {
                        type: "buttons",
                        text: "この質問は新しいQ&Aですか？あるいは既存のQ&Aですか？",
                        actions: [
                            {type:"message", label:"新規", text:"新規"},
                            {type:"message", label:"既存", text:"既存"},
                            {type:"message", label:"わからない", text:"わからない"}
                        ]
                    }
                },
                parser: (value, bot, event, context, resolve, reject) => {
                    return parse(context.sender_language, "is_new_intent", value, ["新規","既存","わからない"], resolve, reject);
                },
                reaction: (error, value, bot, event, context, resolve, reject) => {
                    if (error) return resolve();

                    if (value === "新規"){
                        // Create new intent using question and add response using answer.
                        return dialogflow.add_intent(
                            context.confirmed.question,
                            "robot-response",
                            context.confirmed.question,
                            context.confirmed.answer
                        ).then((response) => {
                            bot.queue({
                                type: "text",
                                text: "では新規Q&Aとして追加しておきます。"
                            });
                            return resolve();
                        });
                    }

                    // Let admin select the intent to add new expression.
                    return this._collect_intent_id(bot, context).then((response) => {
                        return resolve();
                    });
                }
            },
            intent_id: {
                parser: (value, bot, event, context, resolve, reject) => {
                    if (Number(value) !== NaN && Number.isInteger(Number(value)) && Number(value) > 0){
                        if (Number(value) <= context.confirmed.intent_list.length){
                            // User selected existing intent.
                            return resolve(context.confirmed.intent_list[Number(value) - 1].id);
                        } else if (Number(value) === (context.confirmed.intent_list.length + 1)){
                            // User selected new intent.
                            return resolve(null);
                        }
                    }
                    // Invalid.
                    return reject();
                },
                reaction: (error, value, bot, event, context, resolve, reject) => {
                    if (error) resolve();

                    if (value === null){
                        // Admin select to create new intent.
                        return dialogflow.add_intent(
                            context.confirmed.question,
                            "robot-response",
                            context.confirmed.question,
                            context.confirmed.answer
                        ).then((response) => {
                            bot.queue({
                                type: "text",
                                text: "では新規Q&Aとして追加しておきます。"
                            });
                            return resolve();
                        });
                    } else {
                        // Admin select to add sentence to the intent.
                        return dialogflow.add_sentence(
                            value,
                            context.confirmed.question
                        ).then((response) => {
                            bot.queue({
                                type: "text",
                                text: "では例文として追加しておきます。"
                            });
                            return resolve();
                        });
                    }
                }
            }
        }

        this.clear_context_on_finish = (process.env.BOT_EXPRESS_ENV === "test") ? false : true;
    }

    _collect_intent_id(bot, context){
        return dialogflow.get_intent_list()
        .then((all_intent_list) => {
            debug("We remove intents specified in SKIP_INTENT_LIST.");
            let intent_list = [];
            for (let intent of all_intent_list){
                if (!SKIP_INTENT_LIST.includes(intent.name)){
                    intent_list.push(intent);
                }
            }

            // Save intent list to context.
            context.confirmed.intent_list = intent_list;
            debug(`We have ${intent_list.length} intent(s).`);

            let message = {
                type: "text",
                text: "この例文を追加する質問の番号を教えてください。\n"
            }
            let offset = 1;
            for (let intent of intent_list){
                message.text += `${offset} ${intent.name}\n`;
                offset++;
            }
            message.text += `${offset} 新しいQ&Aとして登録`;
            bot.change_message_to_confirm("intent_id", message);
            bot.collect("intent_id");

            return;
        });
    }

    finish(bot, event, context, resolve, reject){
        // Promise List.
        let tasks = [];

        // ### Tasks Overview ###
        // -> Reply to administrator.
        // -> Send message to original user.

        // -> Reply to administrator.
        tasks.push(bot.reply({
            text: "いただいた内容でユーザーへ返信しておきます。"
        }));

        // -> Reply to original user.
        tasks.push(bot.send(context.confirmed.user_id, {
            text: context.confirmed.answer
        }));

        return Promise.all(tasks).then((response) => {
            return resolve();
        });
    }
};
