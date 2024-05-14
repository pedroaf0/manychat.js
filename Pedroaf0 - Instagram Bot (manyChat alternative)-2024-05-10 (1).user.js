// ==UserScript==
// @name         Pedroaf0 - Instagram Bot (manyChat alternative)
// @namespace    http://tampermonkey.net/
// @version      2024-05-10
// @description  automação para responder comentários no instagram e enviar mensagens na DM do instagram
// @author       pedroaf0
// @match        *://*.instagram.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=instagram.com
// @grant        none
// ==/UserScript==


// Configurações

const respostas = [
    {
        comentario: "oi",
        respostaComentario: "Olá, tudo bem?",
        mensagemDM: "Olá, tudo bem?"
    }
]



// funções base

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Função para obter o valor de um cookie específico
function getCookie(name) {
    const cookieString = document.cookie;
    const cookies = cookieString.split(';').map(cookie => cookie.trim());

    for (const cookie of cookies) {
        const [cookieName, cookieValue] = cookie.split('=');
        if (cookieName === name) {
            return cookieValue;
        }
    }

    return null;
}






// função que salva o pk da notificação no localstorage em um array
function salvarPkNotificacao(pk) {
    var notificacoesRespondidas = localStorage.getItem("notificacoesRespondidas");
    if(notificacoesRespondidas){
        notificacoesRespondidas = JSON.parse(notificacoesRespondidas);
        notificacoesRespondidas.push(pk);
        localStorage.setItem("notificacoesRespondidas", JSON.stringify(notificacoesRespondidas));
    } else {
        localStorage.setItem("notificacoesRespondidas", JSON.stringify([pk]));
    }
}

// função que verifica se a notificação já foi respondida
function notificacaoJaRespondida(pk) {
    var notificacoesRespondidas = localStorage.getItem("notificacoesRespondidas");
    if(notificacoesRespondidas){
        notificacoesRespondidas = JSON.parse(notificacoesRespondidas);
        return notificacoesRespondidas.includes(pk);
    } else {
        return false;
    }
}

// função para carregar inbox
async function carregarInbox() {
    var inbox = await fetch("https://www.instagram.com/api/v1/news/inbox/", {
        "headers": {
          "accept": "*/*",
          "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
          "cache-control": "no-cache",
          "content-type": "application/x-www-form-urlencoded",
          "pragma": "no-cache",
          "priority": "u=1, i",
          "sec-ch-prefers-color-scheme": "light",
          "sec-ch-ua": "\"Chromium\";v=\"124\", \"Google Chrome\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
          "sec-ch-ua-full-version-list": "\"Chromium\";v=\"124.0.6367.156\", \"Google Chrome\";v=\"124.0.6367.156\", \"Not-A.Brand\";v=\"99.0.0.0\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-model": "\"\"",
          "sec-ch-ua-platform": "\"Windows\"",
          "sec-ch-ua-platform-version": "\"10.0.0\"",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-asbd-id": "129477",
          "x-csrftoken": getCookie("csrftoken"),
          "x-ig-app-id": "936619743392459",
          "x-ig-www-claim": "hmac.AR3SqAhLbZHDADZfZnVGIXlMESPLH02ACMYvhuiDZg8_nP9d",
          "x-instagram-ajax": "1013439847",
          "x-requested-with": "XMLHttpRequest"
        },
        "referrer": "https://www.instagram.com/notifications/",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": "",
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
      });


// Para mostrar o corpo da resposta como JSON
var jsonResponse = await inbox.json();
console.log(jsonResponse);

return jsonResponse;
}

function getmedia_idandtarget_comment_id(str) {
    const parametros = str.split('?')[1].split('&');
    const obj = {};

    for (let param of parametros) {
        const [chave, valor] = param.split('=');
        obj[chave] = valor;
    }

    return {
        media_id: obj['media_id'],
        target_comment_id: obj['target_comment_id']
    };
}


// função para responder comentário
async function responderComentario(storie) {
    console.log("Respondendo comentário: " + storie.args.comment_text);
    var resposta = respostas.find(resposta => resposta.comentario == storie.args.comment_text);
    console.log(resposta);
    var {media_id, target_comment_id} = getmedia_idandtarget_comment_id(storie.args.destination);
    if(resposta){
        fetch(`https://www.instagram.com/api/v1/web/comments/${media_id}/add/`, {
            "headers": {
                "accept": "*/*",
                "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
                "cache-control": "no-cache",
                "content-type": "application/x-www-form-urlencoded",
                "pragma": "no-cache",
                "priority": "u=1, i",
                "sec-ch-prefers-color-scheme": "light",
                "sec-ch-ua": "\"Chromium\";v=\"124\", \"Google Chrome\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
                "sec-ch-ua-full-version-list": "\"Chromium\";v=\"124.0.6367.119\", \"Google Chrome\";v=\"124.0.6367.119\", \"Not-A.Brand\";v=\"99.0.0.0\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-model": "\"\"",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-ch-ua-platform-version": "\"10.0.0\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-asbd-id": "129477",
                "x-csrftoken": getCookie("csrftoken"),
                "x-ig-app-id": "936619743392459",
                "x-ig-www-claim": "hmac.AR2oTEeNxRFU2JPs_9N7tbYv3SWHb_AZFblXBQDdE_quEjQ5",
                "x-instagram-ajax": "1013424180",
                "x-requested-with": "XMLHttpRequest"
            },
            "referrer": `https://www.instagram.com/p/CC4mMGWpiX5/c/${target_comment_id}/`,
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": `comment_text=${resposta.respostaComentario}&replied_to_comment_id=${target_comment_id}`,
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
            });


    }
}

async function getThreadIdbyUsername(username) {
    var response = await fetch(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`, {
     "headers": {
       "accept": "*/*",
       "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
       "cache-control": "no-cache",
       "pragma": "no-cache",
       "priority": "u=1, i",
       "sec-ch-prefers-color-scheme": "light",
       "sec-ch-ua": "\"Chromium\";v=\"124\", \"Google Chrome\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
       "sec-ch-ua-full-version-list": "\"Chromium\";v=\"124.0.6367.201\", \"Google Chrome\";v=\"124.0.6367.201\", \"Not-A.Brand\";v=\"99.0.0.0\"",
       "sec-ch-ua-mobile": "?0",
       "sec-ch-ua-model": "\"\"",
       "sec-ch-ua-platform": "\"Windows\"",
       "sec-ch-ua-platform-version": "\"10.0.0\"",
       "sec-fetch-dest": "empty",
       "sec-fetch-mode": "cors",
       "sec-fetch-site": "same-origin",
       "x-asbd-id": "129477",
       "x-csrftoken": getCookie("csrftoken"),
       "x-ig-app-id": "936619743392459",
       "x-ig-www-claim": "hmac.AR3SqAhLbZHDADZfZnVGIXlMESPLH02ACMYvhuiDZg8_nKxM",
       "x-requested-with": "XMLHttpRequest"
     },
     "referrer": `https://www.instagram.com/${username}/`,
     "referrerPolicy": "strict-origin-when-cross-origin",
     "body": null,
     "method": "GET",
     "mode": "cors",
     "credentials": "include"
   });

   const jsonResponse = await response.json();
   console.log(jsonResponse.data.user.eimu_id);
   return jsonResponse.data.user.eimu_id;


   }
   window.getThreadIdbyUsername = getThreadIdbyUsername;


// função para enviar mensagem
async function enviarMensagem(storie) {
    console.log("Enviando mensagem: " + storie.args.comment_text);
    var resposta = respostas.find(resposta => resposta.comentario == storie.args.comment_text);
    console.log(resposta);
    if(resposta){
        var tid = await getThreadIdbyUsername(storie.args.profile_name);

        sendDM(tid, resposta.mensagemDM);

    }
}

var numerodeinteracoes = 0;


(async function() {
    'use strict';

while(true){
        // busca novas notificações
        var inbox = await carregarInbox();
        console.log(inbox);
        await sleep(5000);
        // verifica se tem novas notificações (new_stories)
        if(inbox.new_stories.length > 0){
            // loop para percorrer as novas mensagens
            for(var i=0; i<inbox.new_stories.length; i++){
                // verifica se o notif_name é "comment"
                if(inbox.new_stories[i].notif_name == "comment"){
                    // verifica se a notificação já foi respondida
                    if(!notificacaoJaRespondida(inbox.new_stories[i].pk)){
                        console.log("Notificação não respondida");
                        // salva o pk da notificação no localstorage para não responder novamente
                        salvarPkNotificacao(inbox.new_stories[i].pk);

                        // responde o comentário
                        await responderComentario(inbox.new_stories[i]);
                        //  envia a mensagem de resposta
                        await enviarMensagem(inbox.new_stories[i]);
                    }else{
                        console.log("Notificação já respondida");
                    }
                }
            }


        }
}




})();
