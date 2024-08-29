import { sendRequest } from "../../utils/sendRequest";

Page({
  data: {
    options: [' Đi trễ', ' Về Sớm', ' Xin Nghỉ có lương', ' Công tác', ' Bổ sung công', ' Nghỉ không lương', ' Nghỉ lý do khác'],
    index: 0,
    selectedOption: '',
    fileName: '',
    userInfo: {},
    code: '',
    reason: '',
    firstdate: '',
    enddate: '',
    date: '',
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
            url: '/pages/attendance/index' // Navigate to the attendance page on right swipe
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
            url: '/pages/report/report' // Navigate to the report page on left swipe
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

  onPickerTap() {
    const picker = this.selectComponent('#reasonPicker');
    picker.setData({
      display: 'block'
    });
  },

  onDateChange(e) {
    this.setData({
      date: e.detail.value
    });
  },
  onFirstDate(e) {
    this.setData({
      firstdate: e.detail.value
    });
  },
  onEndDate(e) {
    this.setData({
      enddate: e.detail.value
    });
  },


  onPickerChange(e) {
    this.setData({
      index: e.detail.value,
      selectedOption: this.data.options[e.detail.value]
    });
    tt.showToast({
      title: `Bạn đã chọn: ${this.data.options[e.detail.value]}`,
      icon: 'none'
    });
  },

  chooseFile() {
    const that = this;
    tt.chooseImage({
      count: 1,
      sourceType: ['.txt', '.pdf', '.doc', '.docx', '.jpg', '.png', '.jbeg'],
      accept: ['.txt', '.pdf', '.doc', '.docx', '.jpg', '.png', '.jpeg'],
      success(res) {
        const tempFilePaths = res.tempFilePaths;
        // console.log('Selected file details:', tempFilePaths);
        if (tempFilePaths.length > 0) {
          that.setData({
            fileName: tempFilePaths[0],
          });
          tt.showToast({
            title: `Bạn đã chọn tệp: ${tempFilePaths[0]}`,
            icon: 'none'
          });
        }
      },
      fail(err) {
        tt.showToast({
          title: 'Chọn tệp không thành công',
          icon: 'none'
        });
        console.log('File selection failed:', err);
      }
    });
  },

  onLoad() {
    let that = this;
    tt.getStorage({
      key: 'user_info',
      success(res) {
        that.setData({
          userInfo: res.data
        })
        console.log('getStorage successful call', res.data);
      },
      fail(res) {
        console.log('getStorage call failed', res.errMsg);
      },
      complete(res) {
        console.log('getStorage call ends', res.errMsg);
      }
    })

  },


  handleSubmit(e) {
    let selectedOption = this.data.selectedOption;
    let date = this.data.date;
    let reason = this.data.reason;
    let firstdate = this.data.firstdate;
    let enddate = this.data.enddate;
    let fileName = this.data.fileName;
    let that = this;

    if (!selectedOption) {
      tt.showToast({
        title: 'Vui lòng chọn yêu cầu!',
        icon: 'none'
      });
      return;
    }

    if (selectedOption.trim() === 'Công tác') {
      if (!firstdate) {
        tt.showToast({
          title: 'Vui lòng chọn ngày đi!',
          icon: 'none'
        });
        return;
      }

      if (!enddate) {
        tt.showToast({
          title: 'Vui lòng chọn ngày về!',
          icon: 'none'
        });
        return;
      }

      const endDate = enddate;
      const startDate = firstdate;

      if (startDate && new Date(endDate) < new Date(startDate)) {
        tt.showModal({
            title: '⚠️',
            content: 'Ngày về không hợp lệ',
          });
          return;
      }

    } else if (!date) {
      tt.showToast({
        title: 'Vui lòng chọn ngày!',
        icon: 'none'
      });
      return;
    }

    if (!reason) {
      tt.showToast({
        title: 'Vui lòng nhập lý do!',
        icon: 'none'
      });
      return;
    }

    if (!fileName) {
      tt.showToast({
        title: 'Vui lòng chọn minh chứng!',
        icon: 'none'
      });
      return;
    }


    tt.showModal({
      title: 'Xác nhận',
      content: 'Bạn có chắc chắn muốn gửi yêu cầu này không?',
      success(res) {
        if (res.confirm) {
          tt.getStorage({
            key: 'app_access_token',
            success(res) {
              let app_access_token = res.data;
              tt.getStorage({
                key: 'user_access_token',
                success(res) {
                  const user_resp = res;
                  const fileSystemManager = tt.getFileSystemManager();
                  fileSystemManager.readFile({
                    filePath: that.data.fileName,
                    encoding: "base64",
                    success(res) {
                      let url = 'https://script.google.com/macros/s/AKfycbxhfDmKiziX7qCouyECEUH2djZnFU9HcybnpgXhT7NJ6f2hXr-mbjUZ6YDwuXdTa967/exec';
                      let method = 'POST';
                      let headers = {
                        'Content-Type': 'application/json',
                        // 'Authorization': `Bearer ${app_access_token}`
                      };
                      let name = that.data.fileName.split("/")[that.data.fileName.split("/").length - 1];
                      let type = `"image/"+${that.data.fileName.split("/")[that.data.fileName.split("/").length - 1]}`;
                      let body = {
                        "action": "uploadImage",
                        "name": name,
                        "type": type,
                        "typeOfFile": "image",
                        "appAccessToken": app_access_token,
                        "base64String": res.data
                      }
                      console.log(body);
                      sendRequest(url, method, headers, body).then(resp => {
                        let code = resp.data.code;
                        let url = 'https://open.larksuite.com/open-apis/approval/v4/instances';
                        let method = 'POST';
                        let headers = {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${app_access_token}`
                        };

                        let map = {
                          "Đi trễ": "lxa30xo8-ta0acjpxom-0",
                          "Về Sớm": "lxa30xo8-zpuojuk9gyo-0",
                          "Xin Nghỉ có lương": "lxa30xo8-8wfilih9mco-0",
                          "Công tác": "lxl4zgwy-kl8mkv64im-1",
                          "Bổ sung công": "lxl4zgwy-a6vn1vbm5i-3",
                          "Nghỉ không lương": "lxl4zgwy-b55ekcoxh8d-7",
                          "Nghỉ lý do khác": "lxl4zgwy-ab81ds3rxks-5",
                        };
                        let requestData;
                        if (selectedOption.trim() == 'Công tác') {

                          requestData = {
                            "approval_code": "AA85773C-6F31-4379-A187-3C18D28084BB",
                            "user_id": user_resp.data.data.user_id,
                            "open_id": user_resp.data.data.open_id,
                            "form": JSON.stringify([
                              {
                                "id": "widget17187895178040001",
                                "required": true,
                                "type": "dateInterval",
                                "value": {
                                  "start": `${firstdate}T08:12:01+08:00`,
                                  "end": `${enddate}T08:12:01+08:00`,
                                  "interval": Number(enddate.split("-")[2]) - Number(firstdate.split("-")[2]) + 1,
                                }
                              },
                              {
                                "default_value_type": "",
                                "display_condition": null,
                                "enable_default_value": false,
                                "id": "widget17187899094750001",
                                "name": "Lý do",
                                "printable": true,
                                "required": true,
                                "type": "input",
                                "visible": true,
                                "widget_default_value": "",
                                "value": reason
                              },
                              {
                                "default_value_type": "",
                                "display_condition": null,
                                "enable_default_value": false,
                                "id": "widget17192195417790001",
                                "name": "Minh chứng",
                                "printable": true,
                                "required": true,
                                "type": "image",
                                "visible": true,
                                "widget_default_value": "",
                                "value": [code]
                              },

                            ]),
                            "node_approver_user_id_list": [
                              { "key": "1478633bc1631eddbeb834971150630b", "value": [user_resp.data.data.user_id] },
                              { "key": "manager_node_id", "value": [user_resp.data.data.user_id] }
                            ],
                            "node_approver_open_id_list": [
                              { "key": "b1a326c06d88bf042f73d70f50197905", "value": [user_resp.data.data.open_id] },
                              { "key": "manager_node_id", "value": [user_resp.data.data.open_id] }
                            ]
                          };
                        } else {
                          requestData = {
                            "approval_code": "C04D6C99-6C86-44C2-ADFF-894EED3D23D2",
                            "user_id": user_resp.data.data.user_id,
                            "open_id": user_resp.data.data.open_id,
                            "form": JSON.stringify([
                              {
                                "id": "widget17180910073520001",
                                "name": "Chọn Mục",
                                "required": true,
                                "type": "radioV2",
                                "visible": true,
                                "value": map[`${selectedOption.trim()}`],
                              },
                              {

                                "id": "widget17187665078540001",
                                "name": "Date",
                                "printable": true,
                                "required": true,
                                "type": "date",
                                "value": `${date}T08:12:01+08:00`,
                              },
                              {
                                "default_value_type": "",
                                "display_condition": null,
                                "enable_default_value": false,
                                "id": "widget17180911996680001",
                                "name": "Lý Do",
                                "printable": true,
                                "required": true,
                                "type": "input",
                                "visible": true,
                                "widget_default_value": "",
                                "value": reason
                              },

                              {
                                "default_value_type": "",
                                "display_condition": null,
                                "enable_default_value": false,
                                "id": "widget17191997447670001",
                                "name": "Minh chứng",
                                "printable": true,
                                "required": true,
                                "type": "image",
                                "visible": true,
                                "widget_default_value": "",
                                "value": [code]
                              }
                            ]),
                            "node_approver_user_id_list": [
                              { "key": "e023507bffe5c8528406ed4c8ded304f", "value": [user_resp.data.data.user_id] },
                              { "key": "manager_node_id", "value": [user_resp.data.data.user_id] }
                            ],
                            "node_approver_open_id_list": [
                              { "key": "b1a326c06d88bf042f73d70f50197905", "value": [user_resp.data.data.open_id] },
                              { "key": "manager_node_id", "value": [user_resp.data.data.open_id] }
                            ]
                          };
                        }
                        sendRequest(url, method, headers, requestData)
                          .then(response => {
                            console.log('Request successful', response);
                            tt.showToast({
                              title: 'Đã gửi yêu cầu thành công!',
                              icon: 'success'
                            });
                            that.resetData();
                          })
                          .catch(error => {
                            console.log('Request submitted', error);
                            tt.showToast({
                              title: 'Đã gửi yêu cầu thành công!',
                              icon: 'none'
                            });
                          });
                      })
                    },
                    fail(res) {
                      console.log(`readFile fail: ${JSON.stringify(res)}`);
                    }
                  });
                },
                fail(res) {
                  console.log('getStorage call failed', res.errMsg);
                  tt.showToast({
                    title: 'Không thể lấy access token',
                    icon: 'none'
                  });
                },
                complete(res) {
                  console.log('getStorage call ends', res.errMsg);
                }
              });
            },
            fail(res) {
              console.log('getStorage call failed', res.errMsg);
            }
          });
        } else if (res.cancel) {
          tt.showToast({
            title: 'Yêu cầu đã bị hủy',
            icon: 'none'
          });
        }
      }
    });
  },

  bindReasonInput(e) {
    this.setData({
      reason: e.detail.value
    });
  },
  onDateChange: function (e) {
    this.setData({
      date: e.detail.value
    });
  },
  onFirstDate: function (e) {
    this.setData({
      firstdate: e.detail.value
    });
  },
  onEndDate: function (e) {
    this.setData({
      enddate: e.detail.value
    });
  },

  formSubmit(e) {
    this.handleSubmit(e);
  },
  handleFormSubmit(e) {
    this.setData({
      reason: e.detail.value.reason,
      date: e.detail.value.date,
      code: e.detail.value.code,
      firstdate: e.detail.value.firstdate,
      enddate: e.detail.value.enddate,
    });

    this.handleSubmit(e);
  },

  formReset(e) {
    this.resetData();
  },
  resetData() {
    this.setData({
      index: 0,
      selectedOption: '',
      date: '',
      reason: '',
      reason: '',
      // fileId: '',
      firstdate: '',
      enddate: '',
      fileName: '',
    });
    console.log('Data reset', this.data);
  },

  navigateToTarget() {
    tt.navigateTo({
      url: '/pages/request/requestdetail/requestdetail', // Update with your actual target page path
      success(res) {
        console.log('Navigation successful');
      },
      fail(err) {
        console.log('Navigation failed', err);
      }
    });
  }
});