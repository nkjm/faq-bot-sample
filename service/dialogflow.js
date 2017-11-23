"use strict";

const request = require('request');
const debug = require("debug")("bot-express:service");
const URL_BASE = `https://api.api.ai/v1`;
const DIALOGFLOW_DEVELOPER_ACCESS_TOKEN = process.env.DIALOGFLOW_DEVELOPER_ACCESS_TOKEN;

Promise = require('bluebird');
Promise.promisifyAll(request);

module.exports = class ServiceDialogflow {
    static get_intent_list(){
        let url = URL_BASE + "/intents?v=20150910";
        let headers = {
            "Authorization": "Bearer " + DIALOGFLOW_DEVELOPER_ACCESS_TOKEN
        }
        return request.getAsync({
            url: url,
            headers: headers,
            json: true
        }).then(
            (response) => {
                debug(response.body);
                return response.body;
            }
        );
    }

    static get_intent(intent_id){
        let url = URL_BASE + "/intents/" + intent_id + "?v=20150910";
        let headers = {
            "Authorization": "Bearer " + DIALOGFLOW_DEVELOPER_ACCESS_TOKEN
        }
        return request.getAsync({
            url: url,
            headers: headers,
            json: true
        }).then(
            (response) => {
                debug(response.body);
                return response.body;
            }
        );
    }

    static add_sentence(intent_id, sentence){
        return ServiceApiai.get_intent(intent_id).then(
            (intent) => {
                let url = URL_BASE + "/intents/" + intent_id + "?v=20150910";
                let headers = {
                    "Authorization": "Bearer " + DIALOGFLOW_DEVELOPER_ACCESS_TOKEN,
                    "Content-Type": "application/json; charset=utf-8"
                }
                intent.userSays.push({
                    data: [{
                        text: sentence
                    }],
                    isTemplate: false
                });
                return request.putAsync({
                    url: url,
                    headers: headers,
                    body: intent,
                    json: true
                });
            }
        ).then(
            (response) => {
                debug(response.body);
                return response.body;
            }
        );
    }

    static add_intent(intent_name, action, sentence, fulfillment){
        let url = URL_BASE + "/intents?v=20150910";
        let headers = {
            "Authorization": "Bearer " + DIALOGFLOW_DEVELOPER_ACCESS_TOKEN,
            "Content-Type": "application/json; charset=utf-8"
        }
        let intent = {
            name: intent_name,
            auto: true,
            userSays: [{
                data: [{
                    text: sentence
                }],
                isTemplate: false
            }],
            responses: [{
                action: action
            }]
        }
        if (fulfillment){
            if (typeof fulfillment == "string"){
                intent.responses[0].speech = fulfillment;
            } else if (typeof fulfillment == "object"){
                intent.responses[0].messages = [{
                    type: 4,
                    payload: fulfillment
                }]
            }
        }
        return request.postAsync({
            url: url,
            headers: headers,
            body: intent,
            json: true
        }).then(
            (response) => {
                debug(response.body);
                return response.body;
            }
        );
    }
}
