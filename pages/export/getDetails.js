import { sendRequest } from "../../utils/sendRequest";

const getBodyBaseFilter = (res,listArr,filter) => {
  const body = {
    "field_names": listArr,
    "filter": {
      "conjunction": "and",
      "conditions": [
        {
          "field_name": "Tên Nhân Viên",
          "operator": "is",
          "value": [
            res.data.data.open_id,
          ]
        }
      ]
    },
    "automatic_fields": false
  }
  
  if (filter != {}) {
    body.filter.conditions.push(filter)
    return body;
  }

  return body;
}


const getBodySendMessage = (url,res) => {
  const body = {
    "open_id":  res.data.data.open_id,
    "msg_type": "interactive",
    "card": {
      "elements": [
        {
          "tag": "div",
          "text": {
            "content": "<font color='red'>Cám ơn bạn đã nổ lực trong suốt quá trình làm việc, và đây là điều bạn xứng đáng nhận được 😄.  </font>\n**Hãy tiêu dùng hợp lí nhé ^^**\n\n[**LƯƠNG** <= Nhấp vô đây nèee!]"+"("+url+")",
            "tag": "lark_md"
          }
        },
        {
          "tag": "img",
          "img_key": "img_v3_02c1_d8ab93d6-7f6a-43cc-9e46-b2a70dd3a2hu",
          "alt": {
            "tag": "plain_text",
            "content": ""
          },
          "mode": "fit_horizontal",
          "preview": true
        }
      ],
      "header": {
        "template": "carmine",
        "title": {
          "content": "Bảng chi tiết lương",
          "tag": "plain_text"
        }
      }
    }
}
  return body
}

const getHeadersForUser = (res) => {
    const access_token = res.data.data.access_token;
    // const url = url;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`
    };

    return headers;
};

const botSendMessage = (access_token,urlDrive) => {
  tt.getStorage({
    key: "user_access_token",
    success(res) {
        const url = "https://open.larksuite.com/open-apis/message/v4/send/";

        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        }

        const body = {
          "open_id":  res.data.data.open_id,
          "msg_type": "interactive",
          "card": {
            "elements": [
              {
                "tag": "div",
                "text": {
                  "content": "<font color='red'>Cám ơn bạn đã nổ lực trong suốt quá trình làm việc, và đây là điều bạn xứng đáng nhận được 😄.  </font>\n**Hãy tiêu dùng hợp lí nhé ^^**\n\n[**LƯƠNG** <= Nhấp vô đây nèee!]"+"("+urlDrive+")",
                  "tag": "lark_md"
                }
              },
              {
                "tag": "img",
                "img_key": "img_v3_02c1_d8ab93d6-7f6a-43cc-9e46-b2a70dd3a2hu",
                "alt": {
                  "tag": "plain_text",
                  "content": ""
                },
                "mode": "fit_horizontal",
                "preview": true
              }
            ],
            "header": {
              "template": "carmine",
              "title": {
                "content": "Bảng chi tiết lương",
                "tag": "plain_text"
              }
            }
          }
      }

      sendRequest(url, 'POST', headers, body).then(() => {
        console.log("Gui thanh cong");
      });

    }
  })


}



export { getHeadersForUser , getBodySendMessage, getBodyBaseFilter, botSendMessage};