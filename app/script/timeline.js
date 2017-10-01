var timeline = function () {
  var _index = 0;//进度
  var _mProgressTimer;//定时器
  var _speed = 1000;
  var myFun;//执行方法，当前时间为参数
  var weekArray = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

  this.value = 0;
  this.maxValue = 40;
  this.step = 1;
  this.currentX = 0;
  this.currentValue = 0;


  this.init = function (startTime, endTime, callback) {
    var self = this;
    this.callback = callback;
    this.originStartTime = new Date(startTime);
    this.originEndTime = new Date(endTime);
    var start = _formatTime(this.originStartTime);
    $("#scroll_Thumb").html(start[1]);
    $(".timecode").html(start[2]);

    var dateNum = _getDateDiff(this.originStartTime, this.originEndTime);
    var str = '';
    for (var i = 0; i < dateNum; i++) {
      var d1 = this.originStartTime;
      var d2 = new Date(d1);
      d2.setDate(d1.getDate() + i);
      var week = weekArray[new Date(d2).getDay()];
      var monthNum = d2.getDate() < 10 ? "0" + d2.getDate() : d2.getDate();
      str += '<p>' + week + ' ' + monthNum + '</p>';
    }
    $(".time_slot").html(str);
    $(".time_slot p").css({"width": "calc(" + 100 / dateNum + "% - 1px)"});

    this.maxValue = (this.originEndTime - this.originStartTime) / 3600000;
    this.currentX = $("#scrollBar").width() * (this.value / this.maxValue);
    $("#scroll_Track").css("width", this.currentX + "px");
    $("#scroll_Thumb").css("margin-left", this.currentX + "px");

    // 点击进度条时滑块到达对应位置
    $("#scrollBarBox").click(function (event) {
      var changeX = event.clientX - self.currentX;
      self.currentValue = changeX - self.currentX - $("#scrollBar").offset().left;
      $("#scroll_Thumb").css("margin-left", self.currentValue + "px");
      $("#scroll_Track").css("width", self.currentValue + 2 + "px");
      if ((self.currentValue + 1) >= $("#scrollBar").width()) {
        $("#scroll_Thumb").css("margin-left", $("#scrollBar").width() - 1 + "px");
        $("#scroll_Track").css("width", $("#scrollBar").width() + 2 + "px");
        self.value = self.maxValue;
      } else if (self.currentValue <= 0) {
        $("#scroll_Thumb").css("margin-left", "0px");
        $("#scroll_Track").css("width", "0px");
        self.value = 0;
      } else {
        self.value = Math.round(self.currentValue * self.maxValue / $("#scrollBar").width());
      }
      self.setSlideBarTime(self.value);
    });

    // 鼠标在进度条上面滑动时小滑块显示并对应相应的时间
    $("#scrollBarBox").mousemove(function (event) {
      var changeX = event.clientX - self.currentX;
      self.currentValue = changeX - self.currentX - $("#scrollBar").offset().left;
      $(".timecode").show().css("left", self.currentValue - 28 + "px");
      if ((self.currentValue + 1) >= $("#scrollBar").width()) {
        $(".timecode").css("left", $("#scrollBar").width() - 43 + "px");
        self.value = self.maxValue;
      } else if (self.currentValue <= 0) {
        $(".timecode").css("left", "-28px");
        self.value = 0;
      } else {
        self.value = Math.round(self.currentValue * self.maxValue / $("#scrollBar").width());
      }
      var currDate = new Date(self.originStartTime);
      currDate.setHours(currDate.getHours() + self.value);//十五分钟为进度
      var hours = currDate.getHours() < 10 ? "0" + currDate.getHours() : currDate.getHours();
      var minutes = currDate.getMinutes() < 10 ? "0" + currDate.getMinutes() : currDate.getMinutes();
      // var indexStart = hours + ":" + minutes;
      var indexStart2 = hours + ":" + minutes;
      $(".timecode").html(indexStart2);
      // if (window.parent.currentTime) {
      //   currentTime = indexStart;
      // }
      // SetTime1(value);
    });
    // 鼠标移入进度条时小滑块显示
    $("#scrollBarBox").mouseover(function (event) {
      $(".timecode").show();
    });
    // 鼠标移除进度条时小滑块消失
    $("#scrollBarBox").mouseout(function (event) {
      $(".timecode").hide();
    });
    $(".box").show();
    this.callback(_formatYYYYmmddHH(this.originStartTime));
  };

  function _formatYYYYmmddHH(date) {
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    if (month < 10) {
      month = '0' + month;
    }
    var currDate = _pad(date.getDate());
    var hours = _pad(date.getHours());
    // var minutes = _pad(date.getMinutes());
    return year + '' + month + currDate + hours;
  }

  this.setSlideBarTime = function () {
    var startDate = new Date(this.originStartTime);
    startDate.setHours(startDate.getHours() + this.value);//十五分钟为进度
    var month = startDate.getMonth() + 1 < 10 ? "0" + (startDate.getMonth() + 1) : startDate.getMonth() + 1;
    var currentDate = startDate.getDate() < 10 ? "0" + startDate.getDate() : startDate.getDate();
    var Hours = startDate.getHours() < 10 ? "0" + startDate.getHours() : startDate.getHours();
    var Minutes = startDate.getMinutes() < 10 ? "0" + startDate.getMinutes() : startDate.getMinutes();
    var Seconds = startDate.getSeconds() < 10 ? "0" + startDate.getSeconds() : startDate.getSeconds();
    var indexStart = startDate.getFullYear() + "/" + month + "/" + currentDate + " " + Hours + ":" + Minutes + ":" + Seconds;
    var week = weekArray[new Date(startDate).getDay()];
    var indexStart1 = week + "  " + currentDate + " - " + Hours + ":" + Minutes;
    $("#scroll_Thumb").html(indexStart1);
    this.callback(_formatYYYYmmddHH(startDate));
  }

//重制时间
  function setInterval(_index) {
    window.clearInterval(_mProgressTimer);
    if ($("#progressTime_control").attr("title") === "开始") {
      this.SetValue(_index);
      SetTime(_index)
    } else {
      _mProgressTimer = window.setInterval(function () {
        if (_index <= ScrollBar.maxValue) {
          _index += 1;
          ScrollBar.SetValue(_index);
          SetTime(_index)
        } else {
          progressTimeStop()
        }
      }, _speed);
    }
  }

  this.setValue=function (aValue) {
    this.value = aValue;
    if (this.value >= this.maxValue) this.value = this.maxValue;
    if (this.value <= 0) this.value = 0;
    var mWidth = this.value / this.maxValue * $("#scrollBar").width() + "px";
    $("#scroll_Track").css("width", mWidth);
    $("#scroll_Thumb").css("margin-left", mWidth);
  };

  function _getDateDiff(d1, d2) {
    //86400000=(1000*3600*24)
    return (d2.getTime() - d1.getTime()) / 86400000;
  }

  function _pad(number) {
    return number < 10 ? '0' + number : number;
  }

  function _formatTime(date) {
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    if (month < 10) {
      month = '0' + month;
    }
    var currDate = _pad(date.getDate());
    var hours = _pad(date.getHours());
    var minutes = _pad(date.getMinutes());
    var week = weekArray[date.getDay()];
    var indexStart2 = week + "  " + currDate + " - " + hours + ":" + minutes;
    var indexStart3 = hours + ":" + minutes;
    var firstStart = year + "-" + month + "-" + currDate;
    console.log(indexStart2, indexStart3, firstStart);
    return [firstStart, indexStart2, indexStart3];
  }
};