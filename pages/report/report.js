import { getUserInfo, getBodyByDemand } from './detail';
import { sendRequest } from '../../utils/sendRequest';

Page({
  data: {
    date: new Date(),
    currYear: new Date().getFullYear(),
    currMonth: new Date().getMonth(),
    months: [
      "Tháng 1 - ", "Tháng 2 - ", "Tháng 3 - ", "Tháng 4 - ", "Tháng 5 - ",
      "Tháng 6 - ", "Tháng 7 - ", "Tháng 8 - ", "Tháng 9 - ", "Tháng 10 - ",
      "Tháng 11 - ", "Tháng 12 - "
    ],
    currentDate: '',
    days: [],
    attended: 0,
    latein: 0,
    earlyout: 0,
    norecord: 0,
    daysleft: 0,
    startX: 0,
    startY: 0,
    animation: {},
    attendanceRecords: {},
    listRecordsInMonth: [],
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
            url: '/pages/request/request' // Navigate to the attendance page on right swipe
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
            url: '/pages/export/export' // Navigate to the report page on left swipe
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


  onShow() {
    console.log("onReady function called");

    this.fetchUserData()
      .then(() => {
        console.log("User data fetched successfully");
        this.renderCalendar();
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);

        // Handle the error
        tt.showToast({
          title: 'Failed to load data',
          icon: 'none',
          duration: 2000
        });

        // Optionally, you can still render the calendar with default/empty data
        this.setData({
          attended: 0,
          latein: 0,
          earlyout: 0,
          norecord: 0,
          daysleft: 0,
          attendanceRecords: {}
        });
        this.renderCalendar();
      })
      .finally(() => {
        console.log("onReady process completed");

        // Any cleanup or final actions can go here
        tt.hideLoading();
      });

    // Optionally, show a loading indicator while fetching data
    tt.showLoading({
      title: 'Đang tải...',
    });
    this.renderCalendar();
  },

  getBaseURL(tableId, type) {
    const appInstance = getApp();
    return `https://open.larksuite.com/open-apis/bitable/v1/apps/${appInstance.GlobalConfig.baseId}/tables/${tableId}/records${type}`;
  },

  fetchRecordAttendent() {
    return new Promise((resolve, reject) => {
      let that = this;
      const appInstance = getApp();
      tt.getStorage({
        key: 'user_access_token',
        success: (res) => {
          const headers = getUserInfo(res);
          const body = getBodyByDemand(["Ngày", "Trạng Thái"], res);
          const month = String(this.data.currMonth + 1).padStart(2, '0');
          const monthandyear = `${month}/${this.data.currYear}`;
          body.filter.conditions.push({
            "field_name": "Tháng",
            "operator": "is",
            "value": [monthandyear]
          });
          that.setData({ userInfo: res.data.data });

          const url = that.getBaseURL(appInstance.GlobalConfig.tableIds["Bảng Chấm Công"], "/search");
          sendRequest(url, 'POST', headers, body).then((resp) => {
            console.log("API response:", resp);
            if (resp.data && resp.data.items && resp.data.items.length > 0) {
              that.setData({
                listRecordsInMonth: resp.data.items && resp.data.items
              });
              resolve();
            } else {
              that.setData({
                listRecordsInMonth: []
              });
              resolve();
            }
          }).catch((error) => {
            console.error("Lỗi gọi API:", error);
            reject(error);
          });
        },
        fail: (res) => {
          console.log('Gọi storage lỗi:', res.errMsg);
          reject(new Error('Gọi storage lỗi'));
        },
        complete: (res) => {
          console.log('Hoàn thành gọi storage', res.errMsg);
        }
      });
    });
  },

  fetchUserData() {
    return new Promise((resolve, reject) => {
      let that = this;
      const appInstance = getApp();
      tt.getStorage({
        key: 'user_access_token',
        success: (res) => {
          const headers = getUserInfo(res);
          const body = getBodyByDemand(["Tổng Làm Thực Tế", "Ngày Đi Trễ(TK)", "Ngày Về Sớm(TK)", "Ngày Quên Chấm Công(TK)","Số Ngày Nghỉ Không Phép", "Số Ngày Phép Còn Được Sử Dụng"], res);
          const month = String(this.data.currMonth + 1).padStart(2, '0');
          const monthandyear = `${month}/${this.data.currYear}`;

          body.filter.conditions.push({
            "field_name": "Tháng",
            "operator": "is",
            "value": [monthandyear]
          });

          that.setData({ userInfo: res.data.data });

          const url = that.getBaseURL(appInstance.GlobalConfig.tableIds["Bảng Chi Tiết Chấm Công"], "/search");
          sendRequest(url, 'POST', headers, body).then((resp) => {
            if (resp.data && resp.data.items && resp.data.items.length > 0) {
              const reportDetails = resp.data.items[0].fields;
              that.setData({
                attended: reportDetails["Tổng Làm Thực Tế"].value[0],
                latein: reportDetails["Ngày Đi Trễ(TK)"].value[0],
                earlyout: reportDetails["Ngày Về Sớm(TK)"].value[0],
                norecord: reportDetails["Ngày Quên Chấm Công(TK)"].value[0]+reportDetails["Số Ngày Nghỉ Không Phép"].value[0],
                daysleft: reportDetails["Số Ngày Phép Còn Được Sử Dụng"],
              });

              const attendanceRecords = {};
              resp.data.items.forEach((item) => {
                const date = new Date(item.fields["Ngày"]);
                const day = date.getDate();
                attendanceRecords[day] = item.fields;
              });

              that.setData({
                attendanceRecords
              });

              resolve();
            } else {
              console.log("Không tìm thấy bản ghi cụ thể");
              that.setData({
                attended: 0,
                latein: 0,
                earlyout: 0,
                norecord: 0,
                daysleft: 0,
                attendanceRecords: {}
              });
              resolve();
            }
          }).catch((error) => {
            console.error("Lỗi gọi API:", error);
            reject(error);
          });
        },
        fail: (res) => {
          console.log('Gọi storage lỗi:', res.errMsg);
          reject(new Error('Gọi storage lỗi'));
        },
        complete: (res) => {
          console.log('Hoàn thành gọi storage', res.errMsg);
        }
      });
    });
  },
  getColorsWithStatus(status){
    switch (status) {
      case "Đi Trễ":
        return "#FFD1E3";
      case "Về Sớm":
        return "#FFE9D0";
      case "Đúng Giờ":
        return "#BFF6C3";
      case "Quên Chấm Công":
        return "#FFC96F";
      case "Nghỉ Không Phép":
        return "#FFC96F";
      default:
        return "#FFFFFF";
    }
  },
  getRecordForDay(listRecordsInMonth,day){
    return listRecordsInMonth.find(record => new Date(record.fields["Ngày"]).getDate() === day);
  },

  renderCalendar() {
    const { currYear, currMonth, date, months, attendanceRecords } = this.data;
    let firstDayofMonth = new Date(currYear, currMonth, 1).getDay();
    let lastDateofMonth = new Date(currYear, currMonth + 1, 0).getDate();
    let lastDayofMonth = new Date(currYear, currMonth, lastDateofMonth).getDay();
    let lastDateofLastMonth = new Date(currYear, currMonth, 0).getDate();

    this.fetchRecordAttendent().then(() => {
      let listRecordsInMonth = this.data.listRecordsInMonth;
      let liTag = [];
    for (let i = firstDayofMonth; i > 0; i--) {
      liTag.push({ day: lastDateofLastMonth - i + 1, inactive: true });
    }

    for (let i = 1; i <= lastDateofMonth; i++) {
      let isToday = i === date.getDate() && currMonth === new Date().getMonth() && currYear === new Date().getFullYear();
      let hasRecord = attendanceRecords[i] ? true : false;
      let recordDetail = this.getRecordForDay(listRecordsInMonth,i);
      if(recordDetail?.fields["Trạng Thái"].length > 1 && recordDetail?.fields["Trạng Thái"][1] != "Về Sớm" ){
        color_status = this.getColorsWithStatus(recordDetail?.fields["Trạng Thái"][1]);
      }
      else {
        color_status = this.getColorsWithStatus(recordDetail?.fields["Trạng Thái"][0]);
      }
      liTag.push({ day: i, active: isToday, hasRecord: hasRecord, color_status: color_status});
    }
    for (let i = lastDayofMonth; i < 6; i++) {
      liTag.push({ day: i - lastDayofMonth + 1, inactive: true });
    }
    this.setData({
      currentDate: `${months[currMonth]} ${currYear}`,
      days: liTag
    });
    });
    
  },

  handlePrevNext(e) {
    const { id } = e.currentTarget;
    let { currYear, currMonth, date } = this.data;

    currMonth = id === "prev" ? currMonth - 1 : currMonth + 1;

    if (currMonth < 0 || currMonth > 11) {
      let newDate = new Date(currYear, currMonth, 1);
      currYear = newDate.getFullYear();
      currMonth = newDate.getMonth();
      date = newDate;
    } else {
      date = new Date();
    }

    this.setData({
      currYear,
      currMonth,
      date
    });

    this.renderCalendar();
    this.fetchUserData();
  },

  handleDayClick(e) {
    const { day } = e.currentTarget.dataset;
    this.handlePopup(day);
  },

  handlePopup(day) {
    let that = this;
    const appInstance = getApp();
    tt.getStorage({
      key: 'user_access_token',
      success: (res) => {
        const headers = getUserInfo(res);
        const body = getBodyByDemand(["Giờ Vào", "Giờ Ra"], res);
        const month = String(this.data.currMonth + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const dateString = `${this.data.currYear}-${month}-${dayStr}T00:00:00.000Z`;
        const dateObject = new Date(dateString);
        const timestamp = dateObject.getTime(); // Lấy timestamp (miliseconds)

        body.filter.conditions.push({
          "field_name": "Ngày",
          "operator": "is",
          "value": ["ExactDate", timestamp]
        });
        // console.log(["ExactDate", timestamp]);

        const url = that.getBaseURL(appInstance.GlobalConfig.tableIds["Bảng Chấm Công"], "/search");
        sendRequest(url, 'POST', headers, body).then((resp) => {
          console.log(resp);
          if (resp.data && resp.data.items && resp.data.items.length > 0) {
            const reportDetails = resp.data.items[0].fields;

            const clockin = new Date(reportDetails["Giờ Vào"]).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
            const clockout = new Date(reportDetails["Giờ Ra"]).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

            that.setData({
              clockin: clockin,
              clockout: clockout,
            });
            // console.log(that.data.clockin);
            // console.log(that.data.clockout);
            tt.showModal({
              title: 'Thông báo',
              content: `Hello, bạn đã nhấn vào ngày ${day}.\nGiờ vào: ${that.data.clockin}\nGiờ ra: ${that.data.clockout}`,
              showCancel: false,
              confirmText: 'OK',
              confirmColor: '#3CC51F'
            });
          } else {
            console.log("Không tìm thấy bản ghi cụ thể");
            that.setData({
              clockin: 0,
              clockout: 0,
            });
            tt.showModal({
              title: 'Thông báo',
              content: `Hello, bạn đã nhấn vào ngày ${day}.\nKhông tìm thấy bản ghi cụ thể`,
              showCancel: false,
              confirmText: 'OK',
              confirmColor: '#3CC51F'
            });
          }
        }).catch((error) => {
          console.error("Lỗi gọi API:", error);
        });
      },
      fail: (res) => {
        console.log('Gọi storage lỗi:', res.errMsg);
      },
      complete: (res) => {
        console.log('Hoàn thành gọi storage', res.errMsg);
      }
    });
  }
});