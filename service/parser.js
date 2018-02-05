"use strict";

const debug = require('debug')('bot-express:service');
const nlu = require("../service/dialogflow");
const default_lang = "ja";
Promise = require('bluebird');

module.exports = class ServiceParser {
    static by_nlu_with_list(lang = default_lang, parameter_name, value, acceptable_values, resolve, reject){
        debug("Going to understand value by NLU.");
        return nlu.query(lang, value).then((response) => {
            if (response.status.code != 200){
                debug(response.status.errorDetails);
                return reject();
            }

            if (response.result.parameters[parameter_name]){
                debug("Found entities.");
                if (acceptable_values.includes(response.result.parameters[parameter_name])){
                    debug("Accepted the value.");
                    return resolve(response.result.parameters[parameter_name]);
                }
            }
            return reject();
        })
    }
}
