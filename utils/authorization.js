async function getAuthorizationCode() {
  return new Promise((resolve, reject) => {
    if (tt.requestAccess) {
      tt.requestAccess({
        scopeList: ["bitable:app", "approval:approval", "approval:approval.list:readonly", "approval:approval:readonly"],
        success: (res) => {
          const { code } = res;
          resolve(code);
          console.log(`Authorization code: ${code}`);
        },
        fail: (error) => {
          const { errno, errString } = error;
          console.error(`Error: ${errString} (errno: ${errno})`);
          reject({ errno, errString });
        },
      });
    } else {
      tt.login({
        scopeList: ["bitable:app", "approval:approval", "approval:approval.list:readonly", "approval:approval:readonly"],
        success: (res) => {
          const { code } = res;
          resolve(code);
        },
        fail: (error) => {
          const { errno, errString } = error;
          reject({ errno, errString });
        },
      });
    }
    // tt.login({
    //   scopeList: ["bitable:app", "approval:approval", "approval:approval.list:readonly", "approval:approval:readonly"],
    //   success: (res) => {
    //     const { code } = res;
    //     resolve(code);
    //   },
    //   fail: (error) => {
    //     const { errno, errString } = error;
    //     reject({ errno, errString });
    //   },
    // });
  });
}

async function getAppAccessToken(appId, appSecret) {
  return new Promise((resolve, reject) => {
    const url = 'https://open.larksuite.com/open-apis/auth/v3/app_access_token/internal';
    const headers = {
      'Content-Type': 'application/json'
    };
    const body = JSON.stringify({
      app_id: appId,
      app_secret: appSecret
    });

    tt.request({
      url: url,
      method: 'POST',
      data: body,
      header: headers,
      success: function (result) {
        if (result.statusCode === 200) {
          resolve(result.data);
        } else {
          reject(new Error(`Error: ${result.statusCode} ${result.data.error || result.data.message}`));
        }
      },
      fail: function ({ errMsg }) {
        console.error('Failed to get app access token:', errMsg);
        reject(new Error(`Request failed: ${errMsg}`));
      },
      complete: function (res) {
        tt.setStorage({
          key: 'app_access_token',
          data: res.data.app_access_token,
          success(res) {
            console.log('setStorage successful call', res.errMsg);
          }
        });
      }
    });
  });
}

async function getUserAccessToken(app_access_token, code) {
  return new Promise((resolve, reject) => {
    const url = 'https://open.larksuite.com/open-apis/authen/v1/access_token';
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${app_access_token}`
    };
    const body = {
      code: code,
      grant_type: 'authorization_code'
    };

    tt.request({
      url: url,
      method: 'POST',
      data: body,
      header: headers,
      success: function (result) {
        if (result.statusCode === 200) {
          resolve(result.data);
        } else {
          reject(new Error(`Error: ${result.statusCode} ${result.data.error || result.data.message}`));
        }
      },
      fail: function ({ errMsg }) {
        console.error('Failed to get access token:', errMsg);
        reject(new Error(`Request failed: ${errMsg}`));
      },
      complete: function (res) {
        tt.setStorage({
          key: 'user_access_token',
          data: res.data,
          success(res) {
            console.log('setStorage successful call', res.errMsg);
          }
        });
      }
    });
  });
}

export { getAuthorizationCode, getUserAccessToken, getAppAccessToken };