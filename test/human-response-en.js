"use strict";

require("dotenv").config();

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const Emulator = require("../test-util/emulator");
const messenger_options = [{
    name: "line",
    options: {
        line_channel_secret: process.env.LINE_CHANNEL_SECRET
    }
}];

chai.use(chaiAsPromised);
const should = chai.should();

for (let messenger_option of messenger_options){
    let emu = new Emulator(messenger_option.name, messenger_option.options);

    describe("Test human-response skill in English from " + emu.messenger_type, function(){
        let user_id = "human-response";

        describe("Select no for auto learning", function(){
            it("will trigger human response.", function(){
                this.timeout(8000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_postback_event(user_id, {
                        data: JSON.stringify({
                            _type: "intent",
                            intent: {
                                name: "human-response",
                                parameters: {
                                    user_id: user_id,
                                    question: `2100年に流行しているテクノロジーは？`
                                }
                            },
                            language: "en"
                        })
                    });
                    return emu.send(event);
                }).then(function(context){
                    context.intent.name.should.equal("human-response");
                    context.confirmed.user_id.should.equal(user_id);
                    context.confirmed.question.should.equal(`2100年に流行しているテクノロジーは？`);
                    context.confirming.should.equal("answer");
                    context.previous.message[0].message.text.should.equal("Then please give me a reply.");
                    let event = emu.create_message_event(user_id, "It's time slip.");
                    return emu.send(event);
                }).then(function(context){
                    context.confirming.should.equal("enable_learning");
                    let event = emu.create_message_event(user_id, "no");
                    return emu.send(event);
                }).then(function(context){
                    context.previous.message[1].message.text.should.equal("I will reply to the user with what I received.");
                });
            });
        });
    });
}
