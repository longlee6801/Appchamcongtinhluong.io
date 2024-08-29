import { sendRequest } from "../../utils/sendRequest";
import { getAppAccessToken, getAuthorizationCode, getUserAccessToken } from "../../utils/authorization";
Page({
  data: {
    userInfo: {},
    currentTime: "00:00:00",
    clockInTime: "",
    clockOutTime: "",
    currentWifi: "Chưa Xác Định",
    currentLocation: "Chưa Xác Định",
    currentCompany: "Chưa Xác Định",
    timeRealClockIn: "08:00:00",
    timeRealClockOut: "17:30:00",
    listAdress: {
      address1: {
        fixedAddress: {
          apartment_number: '838 Xô Viết Nghệ Tĩnh',
          ward: 'Phường 25',
          district: 'Bình Thạnh',
          city: 'TP.HCM',
          company: 'BIT Academy'
        },
        fixedLatitude: 10.812760,
        fixedLongitude: 106.716026,
        SSID: "BIT GROUP LAU 2"
        // SSID: "BIT GROUP LAU 2"
      },
      address2: {
        fixedAddress: {
          apartment_number: '110a Cao Thắng',
          ward: 'Phường 4',
          district: 'Quận 3',
          city: 'TP.HCM',
          company: 'FINSOL'
        },
        fixedLatitude: 10.7723441,
        fixedLongitude: 106.6801583,
        SSID: "BLUE WALE",
      },

    },
    fixedDistance: 100,
    clockInVisible: false,
    clockOutVisible: false,
    isValid: false,
    isClockOut: false,
    clockInLate: false,
    clockOutEarly: false,
    startX: 0,
    startY: 0,
    animation: {},
  },
  touchStart(e) {
    this.setData({
      startX: e.touches[0].pageX,
      startY: e.touches[0].pageY
    });
  },

  touchMove(e) {
    const moveX = e.touches[0].pageX;
    const moveY = e.touches[0].pageY;
    const deltaX = moveX - this.data.startX;
    const deltaY = moveY - this.data.startY;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      let animation = tt.createAnimation({
        duration: 300,
        timingFunction: 'ease-out',
      });

      if (deltaX > 0) {
        // Swipe right
        animation.translateX(100).opacity(0).step();
        this.setData({
          animation: animation.export()
        });
        setTimeout(() => {
          tt.switchTab({
            url: '/pages/export/export' // Navigate to the attendance page on right swipe
          });
        }, 300);
      } else {
        // Swipe left
        animation.translateX(-100).opacity(0).step();
        this.setData({
          animation: animation.export()
        });
        setTimeout(() => {
          tt.switchTab({
            url: '/pages/request/request' // Navigate to the report page on left swipe
          });
        }, 300);
      }
    }
  },

  touchEnd(e) {
    // Reset the animation
    let animation = tt.createAnimation({
      duration: 0,
    });
    animation.translateX(0).opacity(1).step();
    this.setData({
      animation: animation.export()
    });
  },
  resetData(){
    let now = new Date();
    try {
      const date_attendance = new Date(tt.getStorageSync('date_attendance'));
      const dateattString = `${date_attendance.getFullYear()}-${date_attendance.getMonth() + 1}-${date_attendance.getDate()}`
      const currentDateString = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
      if (dateattString !== currentDateString) {
        this.setData({
          clockInVisible: false,
          clockOutVisible: false,
          isValid: false,
          isClockOut: false,
          clockInLate: false,
          clockOutEarly: false
        });
      }
      else {
        // get info attendance
        this.getInfoAttendance();
      }
    }
    catch (error) {
      this.getInfoAttendance();
    }
  },
  onHide(){
    this.authorize();
  },
  onLoad() {
    let count = 0;
    const maxCount = 20; // Maximum number of intervals
    this.resetData();
    // Get user info
    const getUserInfo = setInterval(() => {
      count++;
      if (count >= maxCount) {
        clearInterval(getUserInfo);
      }
      try {
        const userInfo = tt.getStorageSync('user_info');
        if (userInfo.nickName !== undefined) {
          console.log(userInfo);
          this.setData({
            userInfo: userInfo
          });

          clearInterval(getUserInfo);
        }
      }
      catch (error) {
        console.log(`getStorageSync fail: ${JSON.stringify(error)}`);
      }
    }, 1000);
    // interval update current time
    this.intervalUpdateTime();
    // interval compare time
    this.intervalCompareTime();
    // interval valid location or wifi
    this.intervalValidLocationOrWifi();
    setInterval(this.intervalUpdateTime, 1000);
    setInterval(this.intervalCompareTime, 1000);
    setInterval(this.intervalValidLocationOrWifi, 2000);
  },
  authorize() {
    const appInstance = getApp();
    getAuthorizationCode()
      .then((code) => {
        console.log(`Authorization code: ${code}`);
        return getAppAccessToken(appInstance.GlobalConfig.appId, appInstance.GlobalConfig.appSecret)
          .then((tokenData) => {
            getUserAccessToken(tokenData.app_access_token, code)
          });
      })
      .catch((error) => {
        console.error(`Error: ${error.errString} (errno: ${error.errno})`);
      });
  },
  getBaseURL(tableId, type) {
    const appInstance = getApp();
    return `https://open.larksuite.com/open-apis/bitable/v1/apps/${appInstance.GlobalConfig.baseId}/tables/${tableId}/records${type}`;
  },
  getInfoAttendance() {
    let that = this;
    tt.getStorage({
      key: 'time_clock_in',
      success(res) {
        if (res.data !== "") {
          that.setData({
            clockInTime: res.data,
            clockInVisible: true,
          })
        }
        else {
          that.setData({
            clockInVisible: false,
          })
        }
      }
    })
    tt.getStorage({
      key: 'time_clock_out',
      success(res) {
        if (res.data !== "") {
          that.setData({
            clockOutTime: res.data,
            clockOutVisible: true,
          })
        }
        else {
          that.setData({
            clockOutVisible: false,
          })
        }
      }
    })
  },
  clockInButton() {
    try {
      tt.setStorageSync("time_clock_in", this.data.currentTime);
    } catch (error) {
      console.log(`setStorageSync fail: ${JSON.stringify(error)}`);
    }
    if (this.data.clockInLate) {
      try {
        tt.setStorageSync("clock_in_late", true);
      } catch (error) {
        console.log(`setStorageSync fail: ${JSON.stringify(error)}`);
      }
    }
    else {
      try {
        tt.setStorageSync("clock_in_late", false);
      } catch (error) {
        console.log(`setStorageSync fail: ${JSON.stringify(error)}`);
      }
    }

    this.setData({
      clockInVisible: true,
      clockInTime: this.data.currentTime
    });
  },
  clockOutButton() {
    let that = this;
    let currentDate = new Date();
    const currentTime = that.data.currentTime;
    if (that.data.clockOutEarly) {
      tt.showModal({
        "title": "Bạn có chắc là về sớm không ?",
        "content": "Nếu bạn về sớm, bạn phải gửi yêu cầu cho phòng hành chính nhân sự mục gửi yêu cầu.",
        "confirmText": "Đồng Ý",
        "cancelText": "Hủy bỏ",
        "showCancel": true,
        success(res) {
          if (res.confirm) {
            try {
              tt.setStorageSync("time_clock_out", currentTime);
            } catch (error) {
              console.log(`setStorageSync fail: ${JSON.stringify(error)}`);
            }
            that.setData({
              clockOutVisible: true,
              isClockOut: true,
              clockOutTime: currentTime
            });
            that.addRecord(currentDate);
            try {
              tt.setStorageSync("is_clock_out", true);
            } catch (error) {
              console.log(`setStorageSync fail: ${JSON.stringify(error)}`);
            }
          }
        },
        fail(res) {
          console.log(`showModal fail: ${JSON.stringify(res)}`);
        }
      });
    }
    else {
      try {
        tt.setStorageSync("time_clock_out", currentTime);
      } catch (error) {
        console.log(`setStorageSync fail: ${JSON.stringify(error)}`);
      }
      that.setData({
        clockOutVisible: true,
        isClockOut: true,
        clockOutTime: currentTime
      });
      that.addRecord(currentDate);
      try {
        tt.setStorageSync("is_clock_out", true);
      } catch (error) {
        console.log(`setStorageSync fail: ${JSON.stringify(error)}`);
      }
    }
  },
  addRecord(now) {
    let that = this;
    const appInstance = getApp();
      tt.getStorage({
        key: 'user_access_token',
        success(res) {
          let access_token = res.data.data.access_token;
          let url = that.getBaseURL(appInstance.GlobalConfig.tableIds["Bảng Chấm Công"], type = '');
          let method = 'POST'
          const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`
          };

          let listStatus = [];
          let approval = "Chưa Xử Lý";

          let isClockInLate = false;
          try {
            isClockInLate = tt.getStorageSync("clock_in_late");
          } catch (error) {
            console.log(`getStorageSync fail: ${JSON.stringify(error)}`);
          }
          if (isClockInLate) {
            listStatus.push("Đi Trễ");
          }
          if (that.data.clockOutEarly) {
            listStatus.push("Về Sớm");
          }

          if (listStatus.length === 0) {
            listStatus.push("Đúng Giờ");
            approval = "Trống";
          }

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
              "Giờ Vào": that.getTimeStamp(that.data.clockInTime, now),
              "Giờ Ra": that.getTimeStamp(that.data.clockOutTime, now),
              "Ngày": now.getTime(),
              "Trạng Thái": listStatus,
              "Duyệt": approval
            }
          }
          sendRequest(url, method, headers, body)

          access_token = res.data.data.access_token;
          url = that.getBaseURL(appInstance.GlobalConfig.tableIds["Bảng Chi Tiết Chấm Công"], type = '/search');
          method = 'POST'
          let month = "0" + (now.getMonth() + 1);
          let previousMonth = "0" + now.getMonth();
          if (now.getMonth() >= 10) {
            previousMonth = now.getMonth();
          }
          if (now.getMonth() + 1 >= 10) {
            month = now.getMonth() + 1;
          }
          let monthAndYear = `${month}/${now.getFullYear()}`;
          var previousMonthAndYear = `${previousMonth}/${now.getFullYear()}`;
          body = {
            "field_names": [
              "Tên Nhân Viên",
              "Tháng"
            ],
            "filter": {
              "conjunction": "and",
              "conditions": [
                {
                  "field_name": "Tháng",
                  "operator": "is",
                  "value": [
                    monthAndYear
                  ]
                },
                {
                  "field_name": "Tên Nhân Viên",
                  "operator": "is",
                  "value": [
                    res.data.data.open_id
                  ]
                }
              ]
            },

            "automatic_fields": false
          }
          // check if record is exist
          sendRequest(url, method, headers, body).then(resp => {
            let isNotFound = true;
            let length = resp.data.total;
            if (length > 0) {
              isNotFound = false;
            }
            // if record is not exist, create new record
            if (isNotFound) {
              url = that.getBaseURL(appInstance.GlobalConfig.tableIds["Bảng Chi Tiết Chấm Công"], type = '/search');
              method = "POST";
              body = {
                "field_names": [
                  "Tên Nhân Viên",
                  "Tháng",
                  "Số Ngày Phép Còn Được Sử Dụng"
                ],
                "filter": {
                  "conjunction": "and",
                  "conditions": [
                    {
                      "field_name": "Tháng",
                      "operator": "is",
                      "value": [
                        previousMonthAndYear
                      ]
                    },
                    {
                      "field_name": "Tên Nhân Viên",
                      "operator": "is",
                      "value": [
                        res.data.data.open_id
                      ]
                    }
                  ]
                },

                "automatic_fields": false
              }
              let numPermmitAtten = 0;
              sendRequest(url, method, headers, body).then(resp => {
                let length = resp.data.total;
                if (length > 0) {
                  numPermmitAtten = resp.data.items[0].fields["Số Ngày Phép Còn Được Sử Dụng"]
                }
              });
              // add new attendance details record
              url = that.getBaseURL(appInstance.GlobalConfig.tableIds["Bảng Chi Tiết Chấm Công"], type = '');
              method = 'POST'
              body = {
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
                  "Ngày": now.getTime(),
                  "Số Ngày Phép Còn Được Sử Dụng": 1 + numPermmitAtten,
                }
              }
              sendRequest(url, method, headers, body).then(resp => {
                // get contract salary details record
                url = that.getBaseURL(appInstance.GlobalConfig.tableIds["Bảng Nhân Viên"], type = '/search');
                method = 'POST';
                body = {
                  "field_names": [
                    "Tên Nhân Viên",
                    "Lương Cơ Bản Hợp Đồng",
                    "Trách Nhiệm Hợp Đồng",
                    "Ăn Trưa Hợp Đồng",
                    "Xăng Xe Hợp Đồng",
                    "Giảm Trừ Bản Thân",
                    "Tính thuế"
                  ],
                  "filter": {
                    "conjunction": "and",
                    "conditions": [
                      {
                        "field_name": "Tên Nhân Viên",
                        "operator": "is",
                        "value": [
                          res.data.data.open_id
                        ]
                      }
                    ]
                  },
                  "automatic_fields": false
                }
                sendRequest(url, method, headers, body).then(resp => {
                  // create new salary details record
                  url = that.getBaseURL(appInstance.GlobalConfig.tableIds["Bảng Lương Thực Tế"], type = '');
                  method = 'POST';
                  let listSalaryDetails = resp.data.items[0].fields;
                  body = {
                    fields: {
                      ...listSalaryDetails,
                      "Ngày": now.getTime()
                    }
                  }
                  // add new record BHXH Cong ty
                  sendRequest(url, method, headers, body).then(resp => {
                    url = that.getBaseURL(appInstance.GlobalConfig.tableIds["Trích Đóng Bảo Hiểm CTY"], type = '');
                    method = 'POST';
                    body =
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
                        "Ngày": now.getTime()
                      }
                    }
                    sendRequest(url, method, headers, body);
                    url = that.getBaseURL(appInstance.GlobalConfig.tableIds["Trích Lương Nộp Bảo Hiểm Bắt Buộc"], type = '');
                    sendRequest(url, method, headers, body);
                    url = that.getBaseURL(appInstance.GlobalConfig.tableIds["Thuế TNCN"], type = '');
                    sendRequest(url, method, headers, body);
                    url = that.getBaseURL(appInstance.GlobalConfig.tableIds["Phiếu Lương"], type = '');
                    sendRequest(url, method, headers, body);
                  });
                })
              });
            }
          });
        }
      });
  },
  getTimeStamp(timeString, currentDate) {
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    currentDate.setHours(hours);
    currentDate.setMinutes(minutes);
    currentDate.setSeconds(seconds);
    const timestamp = currentDate.getTime();
    return timestamp;
  },
  intervalUpdateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    this.setData({
      currentTime: `${hours}:${minutes}:${seconds}`
    });
  },
  compareTime(inputTime) {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentSeconds = now.getSeconds();

    const [inputHours, inputMinutes, inputSeconds] = inputTime.split(':').map(Number);

    if (inputHours < currentHours ||
      (inputHours === currentHours && inputMinutes < currentMinutes) ||
      (inputHours === currentHours && inputMinutes === currentMinutes && inputSeconds < currentSeconds)) {
      return false;
    } else if (inputHours === currentHours && inputMinutes === currentMinutes && inputSeconds === currentSeconds) {
      return true;
    } else {
      return true;
    }
  },
  intervalCompareTime() {
    let that = this;
    if (that.compareTime(that.data.timeRealClockIn)) {
      that.setData({
        clockInLate: false,
      });
    }
    else {
      that.setData({
        clockInLate: true,
      });
    }
    if (that.compareTime(that.data.timeRealClockOut)) {
      that.setData({
        clockOutEarly: true,
      });
    }
    else {
      that.setData({
        clockOutEarly: false,
      });
    }
  },
  isWithinDistance(latitude, longitude, fixedLatitude, fixedLongitude) {
    let that = this;
    const fixedDistance = that.data.fixedDistance;
    function toRadians(degrees) {
      return degrees * (Math.PI / 180);
    }

    const R = 6371000;
    const deltaLatitude = toRadians(latitude - fixedLatitude);
    const deltaLongitude = toRadians(longitude - fixedLongitude);

    const a = Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
      Math.cos(toRadians(fixedLatitude)) * Math.cos(toRadians(latitude)) *
      Math.sin(deltaLongitude / 2) * Math.sin(deltaLongitude / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const currentDistance = R * c;
    console.log(currentDistance);

    return currentDistance <= fixedDistance;
  },
  intervalValidLocationOrWifi() {
    let that = this;
    tt.authorize({
      scope: "scope.userLocation",
      success(res) {
        tt.getLocation({
          "type": "wgs84",
          "timeout": 5,
          "cacheTimeout": 30,
          "accuracy": "best",
          success(res) {
            const latitude = res.latitude;
            const longitude = res.longitude;
            const fixedLatitude1 = that.data.listAdress.address1.fixedLatitude;
            const fixedLongitude1 = that.data.listAdress.address1.fixedLongitude;
            const fixedLatitude2 = that.data.listAdress.address2.fixedLatitude;
            const fixedLongitude2 = that.data.listAdress.address2.fixedLongitude;
            const isValidDistance1 = that.isWithinDistance(latitude, longitude, fixedLatitude1, fixedLongitude1);
            const isValidDistance2 = that.isWithinDistance(latitude, longitude, fixedLatitude2, fixedLongitude2);
            if (isValidDistance1 || isValidDistance2) {
              that.setData({
                isValid: true,
                currentLocation: isValidDistance1 ? that.data.listAdress.address1.fixedAddress.apartment_number : that.data.listAdress.address2.fixedAddress.apartment_number,
                currentCompany: isValidDistance1 ? that.data.listAdress.address1.fixedAddress.company : that.data.listAdress.address2.fixedAddress.company,
                currentWifi: isValidDistance1 ? that.data.listAdress.address1.SSID : that.data.listAdress.address2.SSID
              });
            }
            else {
              that.setData({
                isValid: false,
                // currentLocation: "Chưa Xác Định",
                // currentCompany: "Chưa Xác Định",
                // currentWifi: "Chưa Xác Định"
              });
            }
          },
          fail(res) {
            console.log(`getLocation fail: ${JSON.stringify(res)}`);
          },
          complete(res) {
            if (!that.data.isValid) {
              tt.getConnectedWifi({
                success(res) {
                  let currentWifi = res.SSID.replace(/"/g, '');
                  that.setData({
                    currentWifi: currentWifi
                  })
                  console.log(`getConnectedWifi success: ${JSON.stringify(res)}`);
                  if (currentWifi == that.data.listAdress.address1.SSID || currentWifi == that.data.listAdress.address2.SSID) {
                    that.setData({
                      isValid: true,
                      currentWifi: currentWifi,
                      currentLocation: currentWifi == that.data.listAdress.address1.SSID ? that.data.listAdress.address1.fixedAddress.apartment_number : that.data.listAdress.address2.fixedAddress.apartment_number,
                      currentCompany: currentWifi == that.data.listAdress.address1.SSID ? that.data.listAdress.address1.fixedAddress.company : that.data.listAdress.address2.fixedAddress.company
                    });
                  }
                  else {
                    that.setData({
                      isValid: false,
                      currentWifi: currentWifi,
                      // currentLocation: "Chưa Xác Định",
                      // currentCompany: "Chưa Xác Định"
                    });
                  }
                },
                fail(res) {
                  console.log(`getConnectedWifi fail: ${JSON.stringify(res)}`);
                }
              });
            }
            console.log(`getLocation complete: ${JSON.stringify(res)}`);
          }
        });
      },
      fail(res) {
        console.log(`authorize fail: ${JSON.stringify(res)}`);
      }
    });
  }
});
