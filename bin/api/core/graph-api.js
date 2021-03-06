/**
 * Copyright 2020, Cologne.Dog, Inc. All rights reserved.
 * Copyright 2019-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Messenger Builder by Cologne.Dog
 * https://www.messenger.com/t/colognedog
 */

"use strict";

// Imports dependencies
const request = require("request"),
  camelCase = require("camelcase"),
  Config = require("../../config/config");

module.exports = class GraphAPi {
  static callSendAPI(requestBody) {
    // Send the HTTP request to the Messenger Platform
    request(
      {
        uri: `${Config.mPlatfom}/me/messages`,
        qs: {
          access_token: Config.pageAccesToken
        },
        method: "POST",
        json: requestBody
      },
      error => {
        if (error) {
          console.error("Unable to send message:", error);
        }
      }
    );
  }

  static callMessengerProfileAPI(requestBody) {
    // Send the HTTP request to the Messenger Profile API

    console.log(`Setting Messenger Profile for app ${Config.appId}`);
    request(
      {
        uri: `${Config.mPlatfom}/me/messenger_profile`,
        qs: {
          access_token: Config.pageAccesToken
        },
        method: "POST",
        json: requestBody
      },
      (error, _res, body) => {
        if (!error) {
          console.log("Request sent:", body);
        } else {
          console.error("Unable to send message:", error);
        }
      }
    );
  }

  static callSubscriptionsAPI(customFields) {
    // Send the HTTP request to the Subscriptions Edge to configure your webhook
    // You can use the Graph API's /{app-id}/subscriptions edge to configure and
    // manage your app's Webhooks product
    // https://developers.facebook.com/docs/graph-api/webhooks/subscriptions-edge
    console.log(
      `Setting app ${Config.appId} callback url to ${Config.webhookUrl}`
    );

    let fields = "messages, messaging_postbacks, messaging_optins, \
      message_deliveries, messaging_referrals";

    if (customFields !== undefined) {
      fields = fields + ", " + customFields;
    }

    request(
      {
        uri: `${Config.mPlatfom}/${Config.appId}/subscriptions`,
        qs: {
          access_token: Config.appId + "|" + Config.appSecret,
          object: "page",
          callback_url: Config.webhookUrl,
          verify_token: Config.verifyToken,
          fields: fields,
          include_values: "true"
        },
        method: "POST"
      },
      (error, _res, body) => {
        if (!error) {
          console.log("Request sent:", body);
        } else {
          console.error("Unable to send message:", error);
        }
      }
    );
  }

  static callSubscribedApps(customFields) {
    // Send the HTTP request to subscribe an app for Webhooks for Pages
    // You can use the Graph API's /{page-id}/subscribed_apps edge to configure
    // and manage your pages subscriptions
    // https://developers.facebook.com/docs/graph-api/reference/page/subscribed_apps
    console.log(`Subscribing app ${Config.appId} to page ${Config.pageId}`);

    let fields = "messages, messaging_postbacks, messaging_optins, \
      message_deliveries, messaging_referrals";

    if (customFields !== undefined) {
      fields = fields + ", " + customFields;
    }

    request(
      {
        uri: `${Config.mPlatfom}/${Config.pageId}/subscribed_apps`,
        qs: {
          access_token: Config.pageAccesToken,
          subscribed_fields: fields
        },
        method: "POST"
      },
      error => {
        if (error) {
          console.error("Unable to send message:", error);
        }
      }
    );
  }

  static async getUserProfile(senderPsid) {
    try {
      const userProfile = await this.callUserProfileAPI(senderPsid);

      for (const key in userProfile) {
        const camelizedKey = camelCase(key);
        const value = userProfile[key];
        delete userProfile[key];
        userProfile[camelizedKey] = value;
      }

      return userProfile;
    } catch (err) {
      console.log("Fetch failed:", err);
    }
  }

  static callUserProfileAPI(senderPsid) {
    return new Promise(function(resolve, reject) {
      let body = [];

      // Send the HTTP request to the Graph API
      request({
        uri: `${Config.mPlatfom}/${senderPsid}`,
        qs: {
          access_token: Config.pageAccesToken,
          fields: "first_name, last_name, gender, locale, timezone"
        },
        method: "GET"
      })
        .on("response", function(response) {
          if (response.statusCode !== 200) {
            reject(Error(response.statusCode));
          }
        })
        .on("data", function(chunk) {
          body.push(chunk);
        })
        .on("error", function(error) {
          console.error("Unable to fetch profile:" + error);
          reject(Error("Network Error"));
        })
        .on("end", () => {
          body = Buffer.concat(body).toString();
          resolve(JSON.parse(body));
        });
    });
  }

  static getPersonaAPI() {
    return new Promise(function(resolve, reject) {
      let body = [];

      // Send the POST request to the Personas API
      console.log(`Fetching personas for app ${Config.appId}`);

      request({
        uri: `${Config.mPlatfom}/me/personas`,
        qs: {
          access_token: Config.pageAccesToken
        },
        method: "GET"
      })
        .on("response", function(response) {
          if (response.statusCode !== 200) {
            reject(Error(response.statusCode));
          }
        })
        .on("data", function(chunk) {
          body.push(chunk);
        })
        .on("error", function(error) {
          console.error("Unable to fetch personas:" + error);
          reject(Error("Network Error"));
        })
        .on("end", () => {
          body = Buffer.concat(body).toString();
          resolve(JSON.parse(body).data);
        });
    });
  }

  static postPersonaAPI(name, profile_picture_url) {
    let body = [];

    return new Promise(function(resolve, reject) {
      // Send the POST request to the Personas API
      console.log(`Creating a Persona for app ${Config.appId}`);

      let requestBody = {
        name: name,
        profile_picture_url: profile_picture_url
      };

      request({
        uri: `${Config.mPlatfom}/me/personas`,
        qs: {
          access_token: Config.pageAccesToken
        },
        method: "POST",
        json: requestBody
      })
        .on("response", function(response) {
          if (response.statusCode !== 200) {
            reject(Error(response.statusCode));
          }
        })
        .on("data", function(chunk) {
          body.push(chunk);
        })
        .on("error", function(error) {
          console.error("Unable to create a persona:", error);
          reject(Error("Network Error"));
        })
        .on("end", () => {
          body = Buffer.concat(body).toString();
          resolve(JSON.parse(body).id);
        });
    }).catch(error => {
      console.error("Unable to create a persona:", error, body);
    });
  }

  static callNLPConfigsAPI() {
    // Send the HTTP request to the Built-in NLP Configs API
    // https://developers.facebook.com/docs/graph-api/reference/page/nlp_configs/

    console.log(`Enable Built-in NLP for Page ${Config.pageId}`);
    request(
      {
        uri: `${Config.mPlatfom}/me/nlp_configs`,
        qs: {
          access_token: Config.pageAccesToken,
          nlp_enabled: true
        },
        method: "POST"
      },
      (error, _res, body) => {
        if (!error) {
          console.log("Request sent:", body);
        } else {
          console.error("Unable to activate built-in NLP:", error);
        }
      }
    );
  }

  static callFBAEventsAPI(senderPsid, eventName) {
    // Construct the message body
    let requestBody = {
      event: "CUSTOM_APP_EVENTS",
      custom_events: JSON.stringify([
        {
          _eventName: "postback_payload",
          _value: eventName,
          _origin: "original_coast_clothing"
        }
      ]),
      advertiser_tracking_enabled: 1,
      application_tracking_enabled: 1,
      extinfo: JSON.stringify(["mb1"]),
      page_id: Config.pageId,
      page_scoped_user_id: senderPsid
    };

    // Send the HTTP request to the Activities API
    request(
      {
        uri: `${Config.mPlatfom}/${Config.appId}/activities`,
        method: "POST",
        form: requestBody
      },
      error => {
        if (!error) {
          console.log(`FBA event '${eventName}'`);
        } else {
          console.error(`Unable to send FBA event '${eventName}':` + error);
        }
      }
    );
  }
};
