import { sendRequest } from "../../utils/sendRequest";
import { getHeadersForUser, getBodyBaseFilter ,botSendMessage} from './getDetails';

const globalData = getApp();

Page({
  data: {
    userInfo: {},
    "total": 0,
    "attended": 0,
    "latein": 0,
    "earlyout": 0,
    "norecord": 0,
    a: "",
    b: "",
    c: "",
    d: "",
    e: "",
    f: "",
    url3: "",
    date: new Date(),
    currMonth: new Date().getMonth(),
    currYear: new Date().getFullYear(),
    months: [
      "Tháng 1 - ", "Tháng 2 - ", "Tháng 3 - ", "Tháng 4 - ", "Tháng 5 - ",
      "Tháng 6 - ", "Tháng 7 - ", "Tháng 8 - ", "Tháng 9 - ", "Tháng 10 - ",
      "Tháng 11 - ", "Tháng 12 - "
    ],
    currentDate: '',
    monthAndYear: "",
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
            url: '/pages/report/report' // Navigate to the attendance page on right swipe
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
            url: '/pages/attendance/index' // Navigate to the report page on left swipe
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

  fetchDayWorks() {
    let that = this;
    tt.getStorage({
      key: 'user_access_token',
      success: (res) => {
        const url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${globalData.GlobalConfig.baseId}/tables/${globalData.GlobalConfig.tableIds["Bảng Chi Tiết Chấm Công"]}/records/search`;
        let arr = ["Số Ngày Làm", "Ngày Đi Trễ(TK)", "Ngày Về Sớm(TK)","Số Ngày Nghỉ Không Phép", "Ngày Quên Chấm Công(TK)"];

        let my = (this.data.currMonth + 1).toString().padStart(2, '0') + "/" + this.data.currYear;
        that.setData({ monthAndYear: my });

        const filter = {
          "field_name": "Tháng",
          "operator": "is",
          "value": [
            that.data.monthAndYear
          ]
        }
        const body = getBodyBaseFilter(res, arr, filter)
        const headers = getHeadersForUser(res);
        that.setData({ userInfo: res.data.data });
        //đếm số ngày làm
        sendRequest(url, 'POST', headers, body).then((resp) => {
          const recordDetails = resp.data.items?.[0]?.fields || {};
          that.setData({
            attended: recordDetails["Số Ngày Làm"]?.value?.[0] ?? 0,
            latein: recordDetails["Ngày Đi Trễ(TK)"]?.value?.[0] ?? 0,
            earlyout: recordDetails["Ngày Về Sớm(TK)"]?.value?.[0] ?? 0,
            norecord: recordDetails["Ngày Quên Chấm Công(TK)"]?.value?.[0] + recordDetails["Số Ngày Nghỉ Không Phép"]?.value?.[0] ?? 0,
          });
        });
      },
      fail: (res) => {
        console.log('goi storage loi :', res.errMsg);
      },
      complete: (res) => {
        console.log('goi xong storage', res.errMsg);
      }
    });
  },
  fetchSalary() {
    tt.showToast({
      title: 'Vui lòng chờ chút...',
      icon: 'loading'
    });
    let that = this;
    tt.getStorage({
      key: "user_access_token",
      success(res) {
        let arr2 = ["Tên Nhân Viên", "Kì Lương", "Số ngày làm trong tháng", "BHXH", "Lương Thực Tế", "Thực Nhận"];
        const url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${globalData.GlobalConfig.baseId}/tables/${globalData.GlobalConfig.tableIds["Phiếu Lương"]}/records/search`;
        const filter = {
          "field_name": "Kì Lương",
          "operator": "is",
          "value": [
            that.data.monthAndYear
          ]
        }
        const body = getBodyBaseFilter(res, arr2, filter);
        const headers = getHeadersForUser(res);
        //lấy lương
        sendRequest(url, 'POST', headers, body).then((resp) => {
          const record = resp.data.items[0]?.fields || {};
          const recordValues = {
            a: record['Tên Nhân Viên']?.[0]?.name || "Không có dữ liệu",
            b: record['Kì Lương']?.value?.[0]?.text || "Không có dữ liệu",
            c: record['Số ngày làm trong tháng']?.value?.[0] || 0,
            d: `${record['BHXH']?.value?.[0]?.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$&,') || 0} vnđ`,
            e: `${record['Lương Thực Tế']?.value?.[0]?.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$&,') || 0} vnđ`,
            f: `${record['Thực Nhận']?.value?.[0]?.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$&,') || 0} vnđ`,
          }
          that.setData(recordValues);
          const toastTitle = recordValues.a === "Không có dữ liệu" ? `Không có dữ liệu ${that.data.monthAndYear}` : `Đã xong dữ liệu ${that.data.monthAndYear}`;
          const toastIcon = recordValues.a === "Không có dữ liệu" ? 'error' : 'success';
          tt.showToast({
            title: toastTitle,
            icon: toastIcon
          });
        });

      },
      fail: (res) => {
        console.log('Gọi Storage lỗi :', res.errMsg);
      },
      complete: (res) => {
        console.log('Done!', res.errMsg);
      }
    })

  },
  onShow() {
    this.renderCalendar();
    this.fetchDayWorks();
    this.fetchSalary();
  },
  renderCalendar() {
    const { currYear, currMonth, date, months } = this.data;
    this.setData({
      currentDate: `${months[currMonth]} ${currYear}`,
    });
  },
  handlePrevNext: function (e) {
    const { id } = e.currentTarget;
    let { currYear, currMonth, date } = this.data;

    currMonth = id === "prev" ? currMonth - 1 : currMonth + 1;

    if (currMonth < 0 || currMonth > 11) { // If current month is less than 0 or greater than 11
      let newDate = new Date(currYear, currMonth, 1);
      currYear = newDate.getFullYear(); // Updating current year with new date year
      currMonth = newDate.getMonth(); // Updating current month with new date month
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
    this.fetchDayWorks();
    this.fetchSalary(); // Call fetchDayWorks() to update the data for the selected month
  },

  exportButton() {
    tt.showLoading({
      title: 'Đang xử lý...',
    });
    let that = this;
    tt.getStorage({
      key: 'app_access_token',
      success(resp) {
        const access_token = resp.data;
        let ten = encodeURIComponent(that.data.a);
        let luong = encodeURIComponent(that.data.b);
        let cong = encodeURIComponent(that.data.c);
        let bhxh = encodeURIComponent(that.data.d);
        let thucte = encodeURIComponent(that.data.e);
        let tong = encodeURIComponent(that.data.f);
        const sendURL = `https://script.google.com/macros/s/AKfycbx6M0tE_0j2Q8ONasFfwOUfqxKJp0Pgh359Grs1ES8r0SJax8sSYpq19ota-NssX8QRMA/exec?ten=${ten}&luong=${luong}&cong=${cong}&bhxh=${bhxh}&thucte=${thucte}&tong=${tong}`;
        console.log(sendURL);
        sendRequest(sendURL, "GET", {}, {}).then((rs) => {
          tt.hideLoading(); // Ẩn trạng thái loading
          tt.showModal({
            title: '✔',
            content: 'Xuất phiếu lương thành công!',
            icon: 'success',
          });
          botSendMessage(access_token, rs.data.url);
        }).catch((err) => {
          tt.hideLoading(); // Ẩn trạng thái loading khi có lỗi
          tt.showToast({
            title: 'Xuất phiếu lương thất bại!',
            icon: 'error',
          });
          console.error('Error:', err);
        });
      },
      fail: (res) => {
        tt.hideLoading(); // Ẩn trạng thái loading khi có lỗi
        console.log('Gọi Storage lỗi :', res.errMsg);
      }
    });
  }

});