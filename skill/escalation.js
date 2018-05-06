"use strict";

const debug = require("debug")("bot-express:skill");
const LINE_ADMIN_USER_ID = process.env.LINE_ADMIN_USER_ID;
const SUPPORTED_MESSAGE_TYPES = ["text"];

module.exports = class SkillEscalation {
    constructor(){
        this.clear_context_on_finish = (process.env.BOT_EXPRESS_ENV === "test") ? false : true;
    }

    finish(bot, event, context, resolve, reject){

        if (!SUPPORTED_MESSAGE_TYPES.includes(event.message.type)){
            debug(`${event.message.type} message type is not supported. We just skip processing this event.`);
            return resolve();
        }

        let tasks = [];

        // Reply to sender.
        tasks.push(bot.reply({
            type: "text",
            text: "すぐ調べます。ちょっとお待ちを。"
        }));

        // Send escalation message to admin.
        let messages_to_admin = [];
        tasks.push(
            Promise.resolve()
            .then((response) => {
                // Get sender's displayName.
                return bot.plugin.line.sdk.getProfile(bot.extract_sender_id());
            })
            .then((response) => {
                if (!response){
                    return Promise.reject(new Error(`Sender user not found.`));
                }

                messages_to_admin.push({
                    type: "text",
                    text: `${response.displayName}さんからいただいた次のメッセージがわかりませんでした。`
                });

                let orig_message = JSON.parse(JSON.stringify(event.message));
                delete orig_message.id;
                messages_to_admin.push(orig_message);

                if (context.translation){
                    // We have translation so kindly add it to the messages for admin.
                    messages_to_admin.push({
                        type: "text",
                        text: "翻訳: " + context.translation
                    })
                }

                messages_to_admin.push({
                    type: "template",
                    altText: `さて、どうしますか？`,
                    template: {
                        type: "buttons",
                        text: `さて、どうしますか？`,
                        actions: [{
                            type: "postback",
                            label: "回答する",
                            displayText: "回答する",
                            data: JSON.stringify({
                                _type: "intent",
                                intent: {
                                    name: "human-response",
                                    parameters: {
                                        user: {
                                            id: bot.extract_sender_id(),
                                            language: context.sender_language
                                        },
                                        question: context.translation || orig_message.text
                                    }
                                },
                                language: "ja"
                            })
                        }]
                    }
                });

                // Send message to admin.
                return bot.send(LINE_ADMIN_USER_ID, messages_to_admin);
            })
        );

        return Promise.all(tasks).then((response) => {
            return resolve();
        }).catch((error) => {
            return reject();
        });
    }
};
