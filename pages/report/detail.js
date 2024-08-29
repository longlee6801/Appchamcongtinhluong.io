const getBodyByDemand = (listArr, res) => {
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
  return body;
};

const getUserInfo = (res) => {
  const access_token = res.data.data.access_token;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`
  };
  return headers;
};

// const getUserattend = (res) => {
//   const headers = {
//     'Content-Type': 'application/json',
//     'Authorization': `Bearer ${access_token}`
//   };
//   return headers;

// }
export {getUserInfo, getBodyByDemand};