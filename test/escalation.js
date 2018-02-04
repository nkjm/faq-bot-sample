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

    describe("Test robot-response skill from " + emu.messenger_type, function(){
        let user_id = process.env.TEST_SENDER_ID;

        describe("Question which bot cannot recognize", function(){
            it("will escalate to FAQ maintainer.", function(){
                this.timeout(8000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, `2100年に流行しているテクノロジーは？`);
                    return emu.send(event);
                }).then(function(context){
                    context.intent.name.should.equal("input.unknown");
                    context.previous.message[3].message.text.should.equal("すぐ調べます。ちょっとお待ちを。");
                });
            });
        });
    });
}
