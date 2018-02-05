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

    describe("Test robot-response skill in English from " + emu.messenger_type, function(){
        let user_id = "robot-response-en";

        describe("Bot can recognize the question", function(){
            it("will reply answer.", function(){
                this.timeout(8000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, `Can I use LINE Messaging API for free?`)
                    return emu.send(event);
                }).then(function(context){
                    context.intent.name.should.equal("robot-response");
                    context.previous.message[0].message.text.should.equal("Yes, a plan called Developer Trial is available for developers. You can sign up from this site. https://developers.line.me");
                });
            });
        });
    });
}
