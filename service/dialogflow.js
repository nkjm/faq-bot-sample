"use strict";

const debug = require("debug")("bot-express:service");
const language = "ja";
const dialogflow = require("dialogflow");
const structjson = require("./structjson");

// Instantiates clients
const contexts_client = new dialogflow.ContextsClient({
    project_id: process.env.GOOGLE_PROJECT_ID,
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
    }
});
const intents_client = new dialogflow.IntentsClient({
    project_id: process.env.GOOGLE_PROJECT_ID,
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
    }
});

// The path to identify the agent that owns the created intent.
const agent_path = intents_client.projectAgentPath(process.env.GOOGLE_PROJECT_ID);

module.exports = class ServiceDialogflow {
    static get_intents(){

    }

    /**
    @method add_intent
    @param {Object} intent
    @param {String} intent.name
    @param {String} intent.training_phrase
    @param {String} intent.action
    @param {String} intent.text_response
    */
    static add_intent(intent){

        const training_phrases = [{
            type: "TYPE_EXAMPLE",
            parts: [{text: intent.training_phrase}]
        }]

        const result = {
            action: intent.action,
            messages: [{
                text: {
                    text: [intent.text_response]
                }
            }]
        }

        const new_intent = {
            displayName: intent.name,
            webhookState: 'WEBHOOK_STATE_DISABLED',
            trainingPhrases: training_phrases,
            mlEnabled: true,
            action: result.action,
            result: result
        };

        debug(new_intent);

        const request = {
            parent: agent_path,
            intent: new_intent
        }

        return intents_client.createIntent(request);
    }
}
