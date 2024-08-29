import { getAuthorizationCode, getAppAccessToken, getUserAccessToken } from './utils/authorization.js';
import { sendRequest } from './utils/sendRequest.js';
App({
  onLaunch: function () {
    this.authorize().then(() => {
      let now = new Date();
      // now.setDate(now.getDate() + 4);
      this.addRecordForLate(now);
    });
  },
  getBaseURL(tableId, type) {
    const appInstance = getApp();
    return `https://open.larksuite.com/open-apis/bitable/v1/apps/${appInstance.GlobalConfig.baseId}/tables/${tableId}/records${type}`;
  },
  getTimeStamp(timeString, currentDate) {
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    currentDate.setHours(hours);
    currentDate.setMinutes(minutes);
    currentDate.setSeconds(seconds);
    const timestamp = currentDate.getTime();
    return timestamp;
  },
  addRecordForLate(currentDate) {
    const appInstance = getApp();
    let that = this;
    let isClockOut = false;
    let isClockInLate = false;
    let clockInTime = "";
    try {
      isClockOut = tt.getStorageSync("is_clock_out");
      clockInTime = tt.getStorageSync("time_clock_in");
    }
    catch (error) {
      console.log(`getStorageSync fail: ${JSON.stringify(error)}`);
    }
    try {
      isClockInLate = tt.getStorageSync("clock_in_late");
    } catch (error) {
      console.log(`getStorageSync fail: ${JSON.stringify(error)}`);
    }
    tt.getStorage({
      key: 'date_attendance',
      success(res) {
        console.log(`check 123: ${JSON.stringify(res)}`);
        let storedDate = new Date(res.data);
        storedDate.setDate(storedDate.getDate() + 1);
        tt.getStorage({
          key: 'user_access_token',
          success(res) {
            const access_token = res.data.data.access_token;
            const url = that.getBaseURL(appInstance.GlobalConfig.tableIds["Bảng Chấm Công"], type = '');
            const method = 'POST'
            const headers = {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${access_token}`
            };
            while (storedDate <= currentDate) {
              console.log(`storedDate: ${storedDate}`);
              if (storedDate.getDay() === 0 || storedDate.getDate() === currentDate.getDate()) {
                storedDate.setDate(storedDate.getDate() + 1);
                continue;
              }
              let listStatus = [];
              listStatus.push("Nghỉ Không Phép");

              let body =
              {
                "fields": {
                  "Tên Nhân Viên": [
                    {
                      "avatar_url": res.data.data.avatar_url,
                      "email": res.data.data.email,
                      "en_name": res.data.data.en_name,
                      "id": res.data.data.open_id,
                      "name": res.data.data.name
                    }
                  ],
                  "Giờ Vào": that.getTimeStamp("08:00:00", storedDate),
                  "Giờ Ra": that.getTimeStamp("08:00:00", storedDate),
                  "Trạng Thái": listStatus,
                  "Ngày": storedDate.getTime(),
                  "Duyệt": "Chưa Xử Lý"
                }
              }
              storedDate.setDate(storedDate.getDate() + 1);
              sendRequest(url, method, headers, body)
            }

          }
        });
        let storedDate1 = new Date(res.data);
        const storedDateString = `${storedDate1.getDate()}/${storedDate1.getMonth() + 1}/${storedDate1.getFullYear()}`;
        const currentDateString = `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;
        if (currentDateString !== storedDateString && clockInTime !== "") {
          // if user forget to clock out, system will auto clock out
          if (!isClockOut) {
            tt.getStorage({
              key: 'time_clock_in',
              success(res) {
                const clockInTime = res.data;
                tt.getStorage({
                  key: 'user_access_token',
                  success(res) {
                    const access_token = res.data.data.access_token;
                    const url = that.getBaseURL(appInstance.GlobalConfig.tableIds["Bảng Chấm Công"], type = '');
                    const method = 'POST'
                    const headers = {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${access_token}`
                    };

                    let listStatus = [];
                    if (isClockInLate) {
                      listStatus.push("Đi Trễ");
                    }
                    listStatus.push("Quên Chấm Công");

                    const body =
                    {
                      "fields": {
                        "Tên Nhân Viên": [
                          {
                            "avatar_url": res.data.data.avatar_url,
                            "email": res.data.data.email,
                            "en_name": res.data.data.en_name,
                            "id": res.data.data.open_id,
                            "name": res.data.data.name
                          }
                        ],
                        "Giờ Vào": that.getTimeStamp(clockInTime, storedDate1),
                        "Giờ Ra": that.getTimeStamp(clockInTime, storedDate1),
                        "Trạng Thái": listStatus,
                        "Ngày": storedDate1.getTime(),
                        "Duyệt": "Chưa Xử Lý"
                      }
                    }
                    sendRequest(url, method, headers, body)
                  }
                });
                tt.removeStorage({
                  key: 'time_clock_in',
                  success(res) {
                    console.log('removeStorage successful call', res.errMsg);
                  }
                });
              },
            });
          }
          tt.removeStorage({
            key: 'time_clock_in',
            success(res) {
              console.log('removeStorage successful call', res.errMsg);
            }
          });
          tt.removeStorage({
            key: 'time_clock_out',
            success(res) {
              console.log('removeStorage successful call', res.errMsg);
            }
          });
          tt.removeStorage({
            key: 'is_clock_out',
            success(res) {
              console.log('removeStorage successful call', res.errMsg);
            }
          });

          tt.removeStorage({
            key: 'clock_in_late',
            success(res) {
              console.log('removeStorage successful call', res.errMsg);
            }
          });
        }
      },
      complete(res) {
        console.log('complete 123', res.errMsg);
        tt.setStorageSync('date_attendance',currentDate.getTime())
      }
    });
  },
  authorize() {
    const appInstance = getApp();
    return new Promise((resolve, reject) => {
      getAuthorizationCode()
        .then(code => {
          return getAppAccessToken(appInstance.GlobalConfig.appId, appInstance.GlobalConfig.appSecret)
            .then(tokenData => {
              return getUserAccessToken(tokenData.app_access_token, code);
            });
        })
        .then(userData => {
          try {
            tt.setStorageSync("user_info", {
              nickName: userData.data.name,
              avatarUrl: userData.data.avatar_url
            });
            resolve(userData);
          } catch (error) {
            console.log(`setStorageSync fail: ${JSON.stringify(error)}`);
            reject(error);
          }
        })
        .catch(error => {
          console.error(`Error: ${error.errString} (errno: ${error.errno})`);
          reject(error);
        });
    });
  },
  
  GlobalConfig:
  {
    appId: 'cli_a6dc750145f81010',
    appSecret: 'UTYkLUwfKv1qRvCbdscLzg3csAaDbxTC',
    baseId: "HM5PbZoRganPb9suUIOlOjfYgUd",
    tableIds: {
      "Bảng Chấm Công": "tblIN34Pgh9IfV5y",
      "Bảng Chi Tiết Chấm Công": "tbloGc7wzdvT8vBa",
      "Bảng Nhân Viên": "tblvSVUiZN9BN5uw",
      "Bảng Lương Thực Tế": "tbljc0nASIGINVzV",
      "Trích Đóng Bảo Hiểm CTY": "tblMF1j1kAuoz4JV",
      "Trích Lương Nộp Bảo Hiểm Bắt Buộc": "tbl5y1z4aF3alOxY",
      "Thuế TNCN": "tblkfL89lboYIvIH",
      "Phiếu Lương": "tblRbDFhFaCVuD3i",
      "Bảng Đăng Kí": "tblUP5XSVitJi7W4"
    }
  }
});