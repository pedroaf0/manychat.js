// ==UserScript==
// @name         sendDM
// @namespace    http://tampermonkey.net/
// @version      2024-05-14
// @description  try to take over the world!
// @author       You
// @match        https://www.instagram.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=instagram.com
// @grant        none
// ==/UserScript==
async function getClientId() {
    const response = await fetch("https://www.instagram.com/direct/", {
        headers: {
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
            "cache-control": "no-cache",
            dpr: "1.25",
            pragma: "no-cache",
            priority: "u=0, i",
            "sec-ch-prefers-color-scheme": "light",
            "sec-ch-ua": "\"Chromium\";v=\"124\", \"Google Chrome\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
            "sec-ch-ua-full-version-list": "\"Chromium\";v=\"124.0.6367.201\", \"Google Chrome\";v=\"124.0.6367.201\", \"Not-A.Brand\";v=\"99.0.0.0\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-model": "\"\"",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-ch-ua-platform-version": "\"10.0.0\"",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "none",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "viewport-width": "690",
        },
        referrerPolicy: "strict-origin-when-cross-origin",
        body: null,
        method: "GET",
        mode: "cors",
        credentials: "include",
    });

    const resp = await response.text();
    const clientId = resp.slice(resp.indexOf('{"clientID":')).split('"')[3];
    const dtsg = resp.slice(resp.indexOf("DTSGInitialData")).split('"')[4];
    const userId = resp.match(/"IG_USER_EIMU":"([^"]+)"/)?.[1];
    return { clientId, dtsg, userId };
}

const getTimeValues = () => {
    // console.log(typing.toString("hex").match(/../g).join(" "));
    // https://intuitiveexplanations.com/tech/messenger
    // link above has good explanation of otid
    const timestamp = BigInt(Date.now());
    const epoch_id = timestamp << BigInt(22);
    const otid = epoch_id + BigInt(Math.floor(Math.random() * 2 ** 22));
    return { timestamp, epoch_id: Number(epoch_id), otid };
  };

async function sendDM(threadId, message) {
    const { clientId, dtsg, userId } = await getClientId();

    const mqttSid = parseInt(Math.random().toFixed(16).split(".")[1]);

    var socket = new WebSocket(`wss://edge-chat.instagram.com/chat?sid=${mqttSid}&cid=${clientId}`);

    socket.onerror = function(event) {
        console.log("Error", event);
    };

    socket.onopen = function(event) {
        console.log("connected");

        // initiate connection
        socket.send(
            generateMqttPacket({
                cmd: "connect",
                protocolId: "MQIsdp",
                clientId: "mqttwsclient",
                protocolVersion: 3,
                clean: true,
                keepalive: 10,
                username: JSON.stringify({
                    u: "userid", // doesnt seem to matter
                    s: mqttSid,
                    cp: 3,
                    ecp: 10,
                    chat_on: true,
                    fg: false,
                    d: clientId,
                    ct: "cookie_auth",
                    mqtt_sid: "",
                    aid: 936619743392459, // app id
                    st: [],
                    pm: [],
                    dc: "",
                    no_auto_fg: true,
                    gas: null,
                    pack: [],
                    php_override: "",
                    p: null,
                    a: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
                    aids: null,
                }),
            })
        );

        // send app settings
        // need to wait for the ack before sending the subscribe
        socket.send(
            generateMqttPacket({
                cmd: "publish",
                messageId: 1,
                qos: 1,
                topic: "/ls_app_settings",
                payload: JSON.stringify({
                    ls_fdid: "",
                    ls_sv: "9477666248971112", // version id
                }),
            })
        );
    };


    function blobToHex(blob) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = function() {
            const arrayBuffer = reader.result;
            const bytes = new Uint8Array(arrayBuffer);
            let hexString = '';
            for (let i = 0; i < bytes.length; i++) {
              const hex = bytes[i].toString(16);
              hexString += (hex.length === 1 ? '0' : '') + hex;
            }
            resolve(hexString);
          };
          reader.onerror = function() {
            reject(new Error('Unable to read blob as hex'));
          };
          reader.readAsArrayBuffer(blob);
        });
      }


    socket.onmessage = async function(event) {
        console.log("onmessage");
        console.log(event);

        var data = event.data;
        console.log(data);
        hex = await blobToHex(data);
        console.log(hex);
        if (hex == "42020001") {
            // ack for app settings

            // subscribe to /ls_resp
            socket.send(
                generateMqttPacket({
                    cmd: "subscribe",
                    qos: 1,
                    subscriptions: [
                        {
                            topic: "/ls_resp",
                            qos: 0,
                        },
                    ],
                    messageId: 3,
                })
            );

            async function apiCall(cid, dtsg, cursor = null) {
const response = await fetch(
    "https://www.instagram.com/api/graphql/",
    {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            authority: "www.instagram.com",
            accept: "*/*",
            "accept-language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
            "cache-control": "no-cache",
            origin: "https://www.instagram.com",
            pragma: "no-cache",
            referer: "https://www.instagram.com/",
            "sec-ch-prefers-color-scheme": "dark",
            "sec-ch-ua":
                '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
            "sec-ch-ua-full-version-list":
                '"Not.A/Brand";v="8.0.0.0", "Chromium";v="114.0.5735.133", "Google Chrome";v="114.0.5735.133"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"macOS"',
            "sec-ch-ua-platform-version": '"13.2.1"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "user-agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
            "x-ig-app-id": "936619743392459",
        },
        body: new URLSearchParams({
            fb_dtsg: dtsg,
            variables: JSON.stringify({
                deviceId: cid,
                requestId: 0,
                requestPayload: JSON.stringify({
                    database: 1,
                    epoch_id: 0,
                    last_applied_cursor: cursor,
                    sync_params: JSON.stringify({}),
                    version: 9477666248971112,
                }),
                requestType: 1,
            }),
            doc_id: "6195354443842040",
        }),
    }
);


  return response;
}
  function parseGetCursorResponse(payload) {
    const j = JSON.parse(payload);

    // tasks we are interested in
    let lsCalls = {
      upsertMessage: [],
    };

    // loop through the tasks
    for (const item of j.step[2][2][2].slice(1)) {
      // if we are interested in the task then add it to the lsCalls object
      if (item[1][1] in lsCalls) {
        lsCalls[item[1][1]].push(item[1].slice(2));
      }
    }

    // major shout out to Radon Rosborough(username radian-software) and  Scott Conway (username scottmconway) for their work in deciphering the lsCalls
    // this parsing would not be possible without their repos
    // https://github.com/scottmconway/unzuckify
    // https://github.com/radian-software/unzuckify
    // https://intuitiveexplanations.com/tech/messenger Radon's blog post on reverse engineering messenger. messenger and instagram use the same protocol

    let newMessages = [];
    for (const item of lsCalls.upsertMessage) {
      const message = item[0];
      const sentTs = item[5][1];
      const messageId = item[8];
      const authorId = item[10][1];

      newMessages.push({
        message,
        messageId,
        sentTs,
        authorId,
      });
    }
    return { newMessages, cursor: j.step[2][1][3][5] };
  }



// get the initial conversations
async function getCursor(cid, dtsg) {
    const response = await apiCall(cid, dtsg);
    const { cursor } = parseGetCursorResponse(
      response.data.data.lightspeed_web_request_for_igd.payload
    );
    return cursor;
  }

  var cursor = await getCursor(clientId, dtsg);


            // not sure exactly what this does but it's required.
    // my guess is it "subscribes to database 1"?
    // may need similar code to get messages.
    socket.send(
        generateMqttPacket({
          cmd: "publish",
          messageId: 5,
          qos: 1,
          dup: false,
          retain: false,
          topic: "/ls_req",
          payload: JSON.stringify({
            app_id: "936619743392459",
            payload: JSON.stringify({
              database: 1,
              epoch_id: Number(BigInt(Date.now()) << BigInt(22)),
              failure_count: null,
              last_applied_cursor: cursor,
              sync_params: null,
              version: 9477666248971112,
            }),
            request_id: 5,
            type: 2,
          }),
        })
      );
        }
    };

    socket.onclose = function(event) {
        console.log("disconnected");
    };


    function publishTask(_tasks) {
        const tasks = Array.isArray(_tasks) ? _tasks : [_tasks];
        const { epoch_id } = getTimeValues();
        const bytesToSend = generateMqttPacket({
          cmd: "publish",
          messageId: 6,
          qos: 1,
          dup: false,
          retain: false,
          topic: "/ls_req",
          payload: JSON.stringify({
            app_id: "936619743392459",
            payload: JSON.stringify({
              tasks,
              epoch_id,
              version_id: "9477666248971112",
            }),
            request_id: 6,
            type: 3,
          }),
        });
        console.error(
          JSON.stringify({
            app_id: "936619743392459",
            payload: JSON.stringify({
              tasks,
              epoch_id,
              version_id: "9477666248971112",
            }),
            request_id: 6,
            type: 3,
          })
        );
        socket.send(bytesToSend);
        return bytesToSend;
      }


      function sendMessage(threadId, message) {
        // typing indicator
        const typing = generateMqttPacket({
          cmd: "publish",
          messageId: 9,
          topic: "/ls_req",
          payload: JSON.stringify({
            app_id: "936619743392459",
            payload: JSON.stringify({
              label: "3",
              payload: JSON.stringify({
                thread_key: threadId,
                is_group_thread: 0,
                is_typing: 1,
                attribution: 0,
              }),
              version: "6243569662359088",
            }),
            request_id: 45,
            type: 4,
          }),
        });


        const { timestamp, otid } = getTimeValues();
        const tasks = [
          {
            label: "46",
            payload: JSON.stringify({
              thread_id: threadId,
              otid: otid.toString(),
              source: 0,
              send_type: 1,
              sync_group: 1,
              text: message,
              initiating_source: 1,
              skip_url_preview_gen: 0,
              text_has_links: 0,
            }),
            queue_name: threadId.toString(),
            task_id: 0,
            failure_count: null,
          },
          {
            label: "21",
            payload: JSON.stringify({
              thread_id: threadId,
              last_read_watermark_ts: Number(timestamp),
              sync_group: 1,
            }),
            queue_name: threadId.toString(),
            task_id: 1,
            failure_count: null,
          },
        ];

        socket.send(typing);
          //wait 3 seconds
          setTimeout(() => {
            // send message
            publishTask(tasks);
          }, 3000);

      }

    setTimeout(() => {
        sendMessage(threadId, message);

    }, 5000);


}

// exporta a função para ser usada globalmente usado window.sendDM
window.sendDM = sendDM;
