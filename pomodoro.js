$(document).ready(function () {
  //defaults - for testing purposes and initial display
  document.getElementById('task-time').innerHTML = defaultTaskTime;
  document.getElementById('break-time').innerHTML = defaultBreakTime;
  taskTimeReset();

  //disable notifications and fullscreen settings on IE and mobile
  if (navigator.userAgent.match(/mobile/gi) ||
      navigator.userAgent.match(/trident/gi) ||
      navigator.userAgent.match(/edge/gi)) {
    document.getElementById('notifications-label').style.display = 'none';
  }

  //Tooltips for settings checkboxes
  $('#continuous-mode-label').tooltip({
    title: 'Don\'t stop the timer when it reaches 0. Proceed to the next timer.',
    placement: 'top',
  });
  $('#notifications-label').tooltip({
    title: 'Not supported in Internet Explorer, Edge, or Mobile browsers yet.',
    placement: 'left',
  });
  $('#test-mode-label').tooltip({
    title: '1 second = 100 milliseconds',
    placement: 'bottom',
  });

  //close tooltips when marking/clearing a checkbox
  $('#continuous-mode-label').click(function () {
    $(this).tooltip('hide');
  });

  $('#notifications-label').click(function () {
    $(this).tooltip('hide');
  });

  $('#test-mode-label').click(function () {
    $(this).tooltip('hide');
  });
});

/*
* Four global variables:
* startSeconds stores the time when the timer is first started to calculate % for
* the progress bar. If this variable has a value, the clock is running. sessionCount
* increases by 1 when the timer reaches 0:00. Odd during break time, even during
* task time. Divide by two to get total # of sessions completed.
* The last two are here for convenience to quickly change defaults for testing purposes
*/

var startSeconds,
    sessionCount = 0,
    defaultTaskTime = 25,
    defaultBreakTime = 5;

/*
 * Main functions
 * timerControl() manages play/pause button and starting + stopping the timer.
 * countDown() uses stringToSeconds() and showTime() to subtract a second from
 * the timer and update the time remaining on the page.
 * stringToSeconds() reads time remaining from the page and converts it to seconds.
 * showTime() converts the seconds from stringToSeconds() back to a time-formatted
 * string and updates the timer.
 */

function timerControl() {
  //If icon = pause, change it to play and stop the timer. If icon = play, change it to pause and start the timer.
  if (document.getElementById('play-pause-button').className === 'fa fa-pause fa-stack-1x') {
    clearInterval(counter);
    document.getElementById('play-pause-button').className = 'fa fa-play fa-stack-1x';
  } else {
    if (!startSeconds) {
      startSeconds = document.getElementById('task-time').innerHTML * 60;
    }

    if ($('#testMode').is(':checked')) {
      counter = setInterval(countDown, 100);
    } else {
      counter = setInterval(countDown, 1000);
    }

    document.getElementById('play-pause-button').className = 'fa fa-pause fa-stack-1x';
  }
}

//subtracts time every second. Switches to break timer / task time when the clock hits 0.
function countDown() {
  var time = document.getElementById('clock-time').innerHTML;
  // subtract a second from the time and update the clock
  if (stringToSeconds(time) > 0) {
    var seconds = stringToSeconds(time) - 1;
    showTime(seconds, 'clock-time');
  }
  //When the clock completes, update the Session Count and then start either break time or task time
  if (time === '0') {
    sessionCount = sessionCount + 1;
    if (sessionCount % 2 === 1) {
      //break time if odd
      clearInterval(counter);
      startSeconds = document.getElementById('break-time').innerHTML * 60;
      showTime(startSeconds, 'clock-time');

      if (document.getElementById('notify').checked === true) {
        notify('Task Timer complete!');
      }

      if ($('#testMode').is(':checked') && ($('#perpetual').is(':checked'))) {
        counter = setInterval(countDown, 100);
      } else if ($('#perpetual').is(':checked')) {
        counter = setInterval(countDown, 1000);
      } else {
        timerControl();
      }

      return;
    } else {
      clearInterval(counter);
      startSeconds = document.getElementById('task-time').innerHTML * 60;
      showTime(startSeconds, 'clock-time');
      document.getElementById('sessionCount').innerHTML = '<span style="color:red">&#x1f345</span> ' + (sessionCount / 2);

      if (document.getElementById('notify').checked === true && document.getElementById('break-time').innerHTML > 0) {
        notify('Break Timer complete. Start your next task! Pomodoro Sessions completed: ' + (sessionCount / 2));
      }

      if ($('#testMode').is(':checked') && ($('#perpetual').is(':checked'))) {
        counter = setInterval(countDown, 100);
      } else if ($('#perpetual').is(':checked')) {
        counter = setInterval(countDown, 1000);
      } else {
        timerControl();
      }

      return;
    }
  }
}

//Takes a time-formatted string and converts it to seconds.
function stringToSeconds(time) {

  var timeArr = time.split(':'),
      hours,
      minutes,
      seconds;

  if (time.indexOf(':') > -1) {

    if (timeArr.length > 2) {
      hours = Number(timeArr[0]);
      minutes = Number(timeArr[1]);
      seconds = Number(timeArr[2]) + (minutes * 60) + (hours * 3600);
      return seconds;
    } else {
      minutes = Number(timeArr[0]);
      seconds = Number(timeArr[1]) + (minutes * 60);
      return seconds;
    }
  } else {
    seconds = time;
    return seconds;
  }
}

//converts seconds from stringToSeconds() back to a time-formatted string.
function showTime(seconds, id) {
  var displayHours = Math.floor(seconds / 3600),
      displayMinutes = Math.floor((seconds - (displayHours * 3600)) / 60),
      displaySeconds = seconds - (displayHours * 3600) - (displayMinutes * 60),
      time = displayHours + ':' + displayMinutes + ':' + displaySeconds;

  if (id == 'clock-time') {
    //main clock shows H:MM:SS, MM:SS, M:SS, SS, or S
    if (displaySeconds < 10 && displayMinutes > 0) {
      displaySeconds = '0' + displaySeconds;
    }

    if (displayMinutes < 10 && displayHours > 0) {
      displayMinutes = '0' + displayMinutes;
    }

    time = displayHours + ':' + displayMinutes + ':' + displaySeconds;

    if (displayHours === 0) {
      time = displayMinutes + ':' + displaySeconds;
    }

    if (displayHours === 0 && displayMinutes === 0) {
      time = displaySeconds;
    }

    // update the progress bar after updating the clock if the timer is running
    if (startSeconds) {
      var progress = (100 - ((seconds / startSeconds) * 100)).toFixed(0);
      document.getElementById('progress-bar').style.width = progress + '%';
      document.getElementById('show-progress').style.visibility = 'visible';
      if (sessionCount % 2 === 1) {
        document.getElementById('progress-bar').innerHTML = '&nbspBreak&nbspTime:&nbsp&nbsp' + progress + '%&nbspcomplete';
      } else {
        document.getElementById('progress-bar').innerHTML = '&nbspTask&nbspTime:&nbsp&nbsp' + progress + '%&nbspcomplete';
      }
    }
  } else {
    //task and break times shown as H:MM, MM, or M.
    if (displayHours === 0) {
      time = displayMinutes;
    } else if (displayHours > 0 && displayMinutes < 10) {
      time = displayHours + ':' + '0' + displayMinutes;
    } else {
      time = displayHours + ':' + displayMinutes;
    }
  }

  document.getElementById(id).innerHTML = time;
}

/*
 *
 *  Desktop notifications
 *
 */

//Ask permission for desktop notifications when the setting is enabled
$('input[id="notify"]').change(function () {
  if (document.getElementById('notify').checked === true) {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }
});

//Error out or present the notification
function notify(message) {
  if (Notification.permission !== 'granted') {
    alert('Desktop notifications are disabled in your browser. Please change this setting or use another browser. Clear the Desktop notification checkbox below to prevent this alert from appearing again.');

    return;
  }

  var notification = new Notification('Pomodoro Timer', {
    icon: 'http://i.imgur.com/1j1SXzk.jpg',
    body: message,
  });
}

/*
 *
 * Buttons for Reset, Task Time, and Break Time
 *
 */

//The next eight functions are for the plus, minus, and reset buttons
function taskTimeUp() {
  var seconds = stringToSeconds(document.getElementById('task-time').innerHTML) * 60;
  if (seconds < (7200)) {
    var id = 'task-time';
    seconds = seconds + 60;
    showTime(seconds, id);
    updateClock(seconds);
  }
}

function taskTimeDown() {
  var seconds = stringToSeconds(document.getElementById('task-time').innerHTML) * 60;
  if (seconds > (60)) {
    var id = 'task-time';
    seconds = seconds - 60;
    showTime(seconds, id);
    updateClock(seconds);
  }
}

function taskTimeReset() {
  document.getElementById('task-time').innerHTML = defaultTaskTime;
  var seconds = stringToSeconds(document.getElementById('task-time').innerHTML) * 60;
  var id = 'task-time';
  showTime(seconds, id);
  updateClock(seconds);
}

//Update the clock with the current Task Time value
function updateClock(seconds) {
  if (!startSeconds) {
    var id = 'clock-time';
    showTime(seconds, id);
  }
}

//adjust break times
function breakTimeUp() {
  var time = document.getElementById('break-time').innerHTML;
  var seconds = stringToSeconds(time) * 60;
  if (seconds < (7200)) {
    var id = 'break-time';
    seconds = seconds + 60;
    showTime(seconds, id);
  }
}

function breakTimeDown() {
  var time = document.getElementById('break-time').innerHTML;
  var seconds = stringToSeconds(time) * 60;
  if (seconds > (0)) {
    var id = 'break-time';
    seconds = seconds - 60;
    showTime(seconds, id);
  }
}

function breakTimeReset() {
  document.getElementById('break-time').innerHTML = defaultBreakTime;
}

//Reset the timer back to the current Task Time setting. Stop the clock if running.
function timerReset() {
  clearInterval(counter);
  var seconds = stringToSeconds(document.getElementById('task-time').innerHTML) * 60;
  startSeconds = null;
  var id = 'clock-time';
  showTime(seconds, id);
  sessionCount = 0;
  document.getElementById('play-pause-button').className = 'fa fa-play fa-stack-1x';
  document.getElementById('show-progress').style.visibility = 'hidden';
  document.getElementById('sessionCount').innerHTML = '<span style="color:red">&#x1f345</span> 0';
}
