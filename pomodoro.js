var d = document

$(d).ready(function() {
  //defaults - for testing purposes and initial display
  d.getElementById("task-time").innerHTML = default_task_time
  d.getElementById("break-time").innerHTML = default_break_time
  taskTimeReset()

  //disable notifications settings on IE and mobile
  if (navigator.userAgent.match(/mobile/gi) || navigator.userAgent.match(/trident/gi) || navigator.userAgent.match(/edge/gi)) {
    d.getElementById("notifications-label").style.display = "none"
  }
})

//Four global variables:
//startSeconds stores the time when the timer is first started to calculate % for the progress bar. If this variable has a value, the clock is running.
//sessionCount increases by 1 when the timer reaches 0:00. Odd during break time, even during task time. Divide by two to get total # of sessions completed.
//The last two are here for convenience to quickly change defaults for testing purposes
var startSeconds
var sessionCount = 0
var default_task_time = 25
var default_break_time = 5

/* 
 * Main functions
 * timerControl() manages the play/pause button and starting + stopping the timer.
 * countDown() uses stringToSeconds() and showTime() to subtract a second from the timer and update the time remaining on the page.
 * stringToSeconds() reads the time remaining from the page and converts it to seconds.
 * showTime() converts the seconds from stringToSeconds() back to a time-formatted string and updates the timer.
 */
function timerControl() {
  //If icon = pause, change it to play and stop the timer. If icon = play, change it to pause and start the timer.
  if (d.getElementById("play-pause-button").className === "fa fa-pause fa-stack-1x") {
    clearInterval(counter)
    d.getElementById("play-pause-button").className = "fa fa-play fa-stack-1x"
  } else {
    if (!startSeconds) {
      startSeconds = d.getElementById("task-time").innerHTML * 60
    }
    if ($('#testMode').is(':checked')) {
      counter = setInterval(countDown, 100)
    } else {
      counter = setInterval(countDown, 1000)
    }
    d.getElementById("play-pause-button").className = "fa fa-pause fa-stack-1x"
  }
}

//subtracts time every second. Switches to break timer / task time when the clock hits 0.
function countDown() {
  var time = d.getElementById("clock-time").innerHTML
    // subtract a second from the time and update the clock
  if (stringToSeconds(time) > 0) {
    var seconds = stringToSeconds(time) - 1
    showTime(seconds, "clock-time")
  }
  //When the clock completes, update the Session Count and then start either break time or task time
  if (time === "0") {
    sessionCount = sessionCount + 1
    if (sessionCount % 2 === 1) {
      //break time if odd
      clearInterval(counter)
      startSeconds = d.getElementById("break-time").innerHTML * 60
      showTime(startSeconds, "clock-time")

      if (d.getElementById("notify").checked === true) {
        notify("Task Timer complete!")
      }

      if ($('#testMode').is(':checked') && ($('#perpetual').is(':checked'))) {
        counter = setInterval(countDown, 100)
      } else if ($('#perpetual').is(':checked')) {
        counter = setInterval(countDown, 1000)
      } else {
        timerControl()
      }
      return
    } else {
      clearInterval(counter)
      startSeconds = d.getElementById("task-time").innerHTML * 60
      showTime(startSeconds, "clock-time")
      d.getElementById("sessionCount").innerHTML = '<span style="color:red">&#x1f345</span> ' + (sessionCount / 2)

      if (d.getElementById("notify").checked === true && d.getElementById("break-time").innerHTML > 0) {
        notify("Break Timer complete. Start your next task! Pomodoro Sessions completed: " + (sessionCount / 2))
      }

      if ($('#testMode').is(':checked') && ($('#perpetual').is(':checked'))) {
        counter = setInterval(countDown, 100)
      } else if ($('#perpetual').is(':checked')) {
        counter = setInterval(countDown, 1000)
      } else {
        timerControl()
      }
      return
    }
  }
}

//Takes a time-formatted string and converts it to seconds.
function stringToSeconds(time) {

  if (time.indexOf(":") > -1) {
    var timeArr = time.split(":")

    if (timeArr.length > 2) {
      var hours = Number(timeArr[0])
      var minutes = Number(timeArr[1])
      var seconds = Number(timeArr[2]) + (minutes * 60) + (hours * 3600)
      return seconds
    } else {
      var minutes = Number(timeArr[0])
      var seconds = Number(timeArr[1]) + (minutes * 60)
      return seconds
    }
  } else {
    var seconds = time
    return seconds
  }
}

//converts seconds from stringToSeconds() back to a time-formatted string.
function showTime(seconds, id) {
  var display_hours = Math.floor(seconds / 3600)
  var display_minutes = Math.floor((seconds - (display_hours * 3600)) / 60)
  var display_seconds = seconds - (display_hours * 3600) - (display_minutes * 60)
  var time = display_hours + ":" + display_minutes + ":" + display_seconds

  if (id == "clock-time") {
    //main clock shows H:MM:SS, MM:SS, M:SS, SS, or S
    if (display_seconds < 10 && display_minutes > 0) {
      display_seconds = "0" + display_seconds
    } 
    
    if (display_minutes < 10 && display_hours > 0) {
      display_minutes = "0" + display_minutes
    }

    var time = display_hours + ":" + display_minutes + ":" + display_seconds

    if (display_hours === 0) {
      var time = display_minutes + ":" + display_seconds
    } 
    
    if (display_hours === 0 && display_minutes === 0) {
      var time = display_seconds
    }

    // update the progress bar after updating the clock if the timer is running
    if (startSeconds) {
      var progress = (100 - ((seconds / startSeconds) * 100)).toFixed(0)
      d.getElementById("progress-bar").style.width = progress + "%"
      d.getElementById("show-progress").style.visibility = "visible"
      if (sessionCount % 2 === 1) {
        d.getElementById("progress-bar").innerHTML = "&nbspBreak&nbspTime:&nbsp&nbsp" + progress + "%&nbspcomplete"
      } else {
        d.getElementById("progress-bar").innerHTML = "&nbspTask&nbspTime:&nbsp&nbsp" + progress + "%&nbspcomplete"
      }
    }
  } else {
    //task and break times shown as H:MM, MM, or M.
    if (display_hours === 0) {
      var time = display_minutes
    } else if (display_hours > 0 && display_minutes < 10) {
      var time = display_hours + ":" + "0" + display_minutes
    } else {
      var time = display_hours + ":" + display_minutes
    }
  }
  d.getElementById(id).innerHTML = time
}

/*
 *
 *  Desktop notifications
 *
 */

//Ask permission for desktop notifications when the setting is enabled
$("input[id='notify']").change(function() {
  if (d.getElementById("notify").checked === true) {
    if (Notification.permission !== "granted") {
      Notification.requestPermission()
    }
  }
})

//Error out or present the notification
function notify(message) {
  if (Notification.permission !== "granted") {
    alert('Desktop notifications are disabled in your browser. Please change this setting or use another browser. Clear the Desktop notification checkbox below to prevent this alert from appearing again.')
    
    return
  }
  var notification = new Notification('Pomodoro Timer', {
    icon: 'http://i.imgur.com/1j1SXzk.jpg',
    body: message
  })
}

/*
 *
 * Buttons for Reset, Task Time, and Break Time
 *
 */
//The next eight functions are for the plus, minus, and reset buttons
function taskTimeUp() {
  var seconds = stringToSeconds(d.getElementById("task-time").innerHTML) * 60
  if (seconds < (7200)) {
    var id = "task-time"
    var seconds = seconds + 60
    showTime(seconds, id)
    updateClock(seconds)
  }
}

function taskTimeDown() {
  var seconds = stringToSeconds(d.getElementById("task-time").innerHTML) * 60
  if (seconds > (60)) {
    var id = "task-time"
    var seconds = seconds - 60
    showTime(seconds, id)
    updateClock(seconds)
  }
}

function taskTimeReset() {
  d.getElementById("task-time").innerHTML = default_task_time
  var seconds = stringToSeconds(d.getElementById("task-time").innerHTML) * 60
  var id = "task-time"
  showTime(seconds, id)
  updateClock(seconds)
}

//Update the clock with the current Task Time value
function updateClock(seconds) {
  if (!startSeconds) {
    var id = "clock-time"
    showTime(seconds, id)
  }
}

//adjust break times
function breakTimeUp() {
  var time = d.getElementById("break-time").innerHTML
  var seconds = stringToSeconds(time) * 60
  if (seconds < (7200)) {
    var id = "break-time"
    var seconds = seconds + 60
    showTime(seconds, id)
  }
}

function breakTimeDown() {
  var time = d.getElementById("break-time").innerHTML
  var seconds = stringToSeconds(time) * 60
  if (seconds > (0)) {
    var id = "break-time"
    var seconds = seconds - 60
    showTime(seconds, id)
  }
}

function breakTimeReset() {
  d.getElementById("break-time").innerHTML = default_break_time
}

//Reset the timer back to the current Task Time setting. Stop the clock if running.
function timerReset() {
  clearInterval(counter)
  var seconds = stringToSeconds(d.getElementById("task-time").innerHTML) * 60
  startSeconds = null
  var id = "clock-time"
  showTime(seconds, id)
  sessionCount = 0
  d.getElementById("play-pause-button").className = "fa fa-play fa-stack-1x"
  d.getElementById("show-progress").style.visibility = "hidden"
  d.getElementById("sessionCount").innerHTML = '<span style="color:red">&#x1f345</span> 0'
}