import axios from "axios";

export const verifyWhatsappWebhook = async (req: any, res: any) => {
    try {
        const WEBHOOK_VERIFY_TOKEN = "HAPPY";
        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];
        // check the mode and token sent are correct
        if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
          // respond with 200 OK and challenge token from the request
          res.status(200).send(challenge);
          console.log("Webhook verified successfully!");
        } else {
          // respond with '403 Forbidden' if verify tokens do not match
          res.sendStatus(403);
        }
    } catch(error) {
        console.error(error);
    }
}

export const whatsAppWebhook = async (req: any, res: any) => {
    try {
        const GRAPH_API_TOKEN = "EAAXKYuGhc0wBO95ZCfylLy1y2PYZB72Np6t8fOsYISqNqYBzHBJswaDZBkesxu3b2PBndGTgZAhHcdJtbNArkARPNVPRfv0BPAXSZAQ2DqoExPTbmZCqkFGrePVB0RVkejyTJFQmFcN88yYkWyZCbZBPROhssOv01kb0iyNf8pLAGkSJ4BWwLdMRuPMzcKUwKLENvszfHl8gJMh5eJzJwxELuD9SoDt3yixVtENY3hZBWJjdoA0XqcoCz"
        // log incoming messages
        console.log("Incoming webhook message:", JSON.stringify(req.body, null, 2));
        // check if the webhook request contains a message
        // details on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
        const message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];
        // check if the incoming message contains text
        if (message?.type === "text") {
          // extract the business number to send the reply from it
          const business_phone_number_id = req.body.entry?.[0].changes?.[0].value?.metadata?.phone_number_id;
          // send a reply message as per the docs here https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
          console.log(GRAPH_API_TOKEN)
          await axios({
            method: "POST",
            url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
            headers: {
              Authorization: `Bearer ${GRAPH_API_TOKEN}`,
            },
            data: {
              messaging_product: "whatsapp",
              to: message.from,
              text: { body: `Yes we got the message jhghjh` },
              context: {
                message_id: message.id, // shows the message as a reply to the original user message
              },
            },
          });
          // mark incoming message as read
          await axios({
            method: "POST",
            url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
            headers: {
              Authorization: `Bearer ${GRAPH_API_TOKEN}`,
            },
            data: {
              messaging_product: "whatsapp",
              status: "read",
              message_id: message.id,
            },
          });
        res.sendStatus(200);
        }
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
}

export const whatsAppBroadcast = async (req: any, res: any) => {
    try {
        const numbers = ['917025683435', '919446806258']
        numbers.map(number => {
            axios.post('https://graph.facebook.com/v21.0/109765502147943/messages', {
                messaging_product: 'whatsapp',
                to: number,
                type: 'text',
                text: {
                    body: 'Hello this is emergency evacuate the office now!! this is an SOS alert!!'
                }
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer EAAXKYuGhc0wBO95ZCfylLy1y2PYZB72Np6t8fOsYISqNqYBzHBJswaDZBkesxu3b2PBndGTgZAhHcdJtbNArkARPNVPRfv0BPAXSZAQ2DqoExPTbmZCqkFGrePVB0RVkejyTJFQmFcN88yYkWyZCbZBPROhssOv01kb0iyNf8pLAGkSJ4BWwLdMRuPMzcKUwKLENvszfHl8gJMh5eJzJwxELuD9SoDt3yixVtENY3hZBWJjdoA0XqcoCz'
                }
            })
        })
        res.send('Hello World!');
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
}