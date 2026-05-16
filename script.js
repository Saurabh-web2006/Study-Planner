// =============================================
// STUDY BLOOM - Main JavaScript File
// this file handles all the functionality
// for our student dashboard project
// =============================================


// -------- LOGIN / SIGNUP SYSTEM --------
// we are using localStorage to store user accounts
// each user gets their own data saved separately

var currentUser = null; // this stores who is currently logged in

// this function creates a simple hash of the password
// so we dont store the actual password in localStorage
// (our professor said we should hash passwords)
function simpleHash(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    var ch = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash = hash & hash; // convert to 32 bit integer
  }
  return hash.toString(36);
}

// get all registered users from localStorage
function getUsers() {
  var users = localStorage.getItem("studyBloom_users");
  if (users) {
    return JSON.parse(users);
  } else {
    return {};
  }
}

// save users back to localStorage
function saveUsers(users) {
  localStorage.setItem("studyBloom_users", JSON.stringify(users));
}


// ---- AUTH MODAL FUNCTIONS ----

// opens the login or signup modal
function openAuthModal(mode) {
  var authOverlay = document.getElementById("auth-overlay");
  switchAuthForm(mode);
  authOverlay.className = "active";

  // auto focus the username input
  setTimeout(function() {
    var input = document.getElementById(mode + "-username");
    if (input) {
      input.focus();
    }
  }, 100);
}

// closes the auth modal with a fade animation
function closeAuthModal() {
  var authOverlay = document.getElementById("auth-overlay");
  authOverlay.classList.add("fade-out");
  setTimeout(function() {
    authOverlay.className = "";
    clearAuthForms();
  }, 280);
}

// switches between login and signup forms
function switchAuthForm(mode) {
  if (mode == "login") {
    document.getElementById("login-form").style.display = "block";
    document.getElementById("signup-form").style.display = "none";
  } else {
    document.getElementById("login-form").style.display = "none";
    document.getElementById("signup-form").style.display = "block";
  }
  clearAuthErrors();
}

// clears all the form inputs
function clearAuthForms() {
  document.getElementById("login-username").value = "";
  document.getElementById("login-password").value = "";
  document.getElementById("signup-username").value = "";
  document.getElementById("signup-password").value = "";
  document.getElementById("signup-confirm").value = "";
  clearAuthErrors();
}

// clears error messages
function clearAuthErrors() {
  document.getElementById("login-error").textContent = "";
  document.getElementById("signup-error").textContent = "";
}

// toggles password visibility (the eye icon button)
function togglePassword(inputId, btn) {
  var input = document.getElementById(inputId);
  if (input.type == "password") {
    input.type = "text";
    btn.textContent = "🙈";
  } else {
    input.type = "password";
    btn.textContent = "👁";
  }
}


// ---- SIGNUP FUNCTION ----
// this runs when user clicks the signup button

function signupUser() {
  var username = document.getElementById("signup-username").value.trim();
  username = username.toLowerCase(); // make it lowercase
  var password = document.getElementById("signup-password").value;
  var confirm = document.getElementById("signup-confirm").value;
  var errorEl = document.getElementById("signup-error");

  // check if username is empty
  if (username == "") {
    errorEl.textContent = "Please enter a username.";
    return;
  }

  // username should be atleast 3 characters
  if (username.length < 3) {
    errorEl.textContent = "Username must be at least 3 characters.";
    return;
  }

  // only allow letters numbers and underscore
  if (/[^a-z0-9_]/.test(username)) {
    errorEl.textContent = "Username: only letters, numbers, underscores.";
    return;
  }

  // check if password is empty
  if (password == "") {
    errorEl.textContent = "Please enter a password.";
    return;
  }

  // password should be atleast 4 characters
  if (password.length < 4) {
    errorEl.textContent = "Password must be at least 4 characters.";
    return;
  }

  // check if both passwords match
  if (password != confirm) {
    errorEl.textContent = "Passwords do not match.";
    return;
  }

  // check if username is already taken
  var users = getUsers();
  if (users[username]) {
    errorEl.textContent = "Username already taken!";
    return;
  }

  // everything is ok, create the account
  users[username] = {
    passwordHash: simpleHash(password),
    createdAt: Date.now()
  };
  saveUsers(users);

  // create default data for the new user
  var defaultData = {
    events: [],
    habits: [
      { name: "Wake up 7AM", days: [0,0,0,0,0,0,0] },
      { name: "Study 3h", days: [0,0,0,0,0,0,0] },
      { name: "Hydrate", days: [0,0,0,0,0,0,0] }
    ],
    subjects: []
  };
  localStorage.setItem("studyBloom_data_" + username, JSON.stringify(defaultData));

  // automatically log them in after signing up
  loginAs(username);
  closeAuthModal();
  console.log("New user signed up: " + username);
}


// ---- LOGIN FUNCTION ----
// this runs when user clicks the login button

function loginUser() {
  var username = document.getElementById("login-username").value.trim();
  username = username.toLowerCase();
  var password = document.getElementById("login-password").value;
  var errorEl = document.getElementById("login-error");

  // check if fields are empty
  if (username == "") {
    errorEl.textContent = "Please enter your username.";
    return;
  }
  if (password == "") {
    errorEl.textContent = "Please enter your password.";
    return;
  }

  // check if account exists
  var users = getUsers();
  if (!users[username]) {
    errorEl.textContent = "Account not found.";
    return;
  }

  // check if password is correct
  if (users[username].passwordHash != simpleHash(password)) {
    errorEl.textContent = "Incorrect password.";
    return;
  }

  // login successful!
  loginAs(username);
  closeAuthModal();
  console.log("User logged in: " + username);
}

// this actually sets the user as logged in and loads their data
function loginAs(username) {
  currentUser = username;
  localStorage.setItem("studyBloom_session", username);

  // load this user's saved data from localStorage
  var savedData = localStorage.getItem("studyBloom_data_" + username);
  if (savedData) {
    data = JSON.parse(savedData);
  } else {
    // if no data found, use empty defaults
    data = { events: [], habits: [], subjects: [] };
  }

  updateAuthUI();
  initDashboard();
}

// logout function - clears the session
function logoutUser() {
  currentUser = null;
  localStorage.removeItem("studyBloom_session");
  data = { events: [], habits: [], subjects: [] };
  updateAuthUI();
  console.log("User logged out");
}

// this function updates what shows in the navbar
// if logged in: shows username and logout button
// if not logged in: shows login and signup buttons
function updateAuthUI() {
  var authBtns = document.getElementById("auth-buttons");
  var userInfo = document.getElementById("user-info");
  var dashboard = document.getElementById("dashboard");
  var welcomeMsg = document.getElementById("welcome-message");

  if (currentUser != null) {
    // user is logged in
    authBtns.style.display = "none";
    userInfo.style.display = "flex";
    document.getElementById("user-greeting").textContent = "✿ Hello, " + currentUser;
    dashboard.classList.remove("hidden-dashboard");
    if (welcomeMsg) {
      welcomeMsg.style.display = "none";
    }
  } else {
    // user is NOT logged in
    authBtns.style.display = "flex";
    userInfo.style.display = "none";
    dashboard.classList.add("hidden-dashboard");
    if (welcomeMsg) {
      welcomeMsg.style.display = "block";
    }
  }
}

// pressing Enter to submit login/signup forms
document.addEventListener("keydown", function(e) {
  if (e.key == "Enter") {
    var authOverlay = document.getElementById("auth-overlay");
    if (authOverlay.classList.contains("active")) {
      // check which form is visible and submit that one
      var loginForm = document.getElementById("login-form");
      if (loginForm.style.display != "none") {
        loginUser();
      } else {
        signupUser();
      }
    }
  }
});

// close auth modal if you click outside it (on the dark area)
document.getElementById("auth-overlay").addEventListener("click", function(e) {
  if (e.target == this) {
    closeAuthModal();
  }
});

// close auth modal with Escape key
document.addEventListener("keydown", function(e) {
  if (e.key == "Escape") {
    var authOverlay = document.getElementById("auth-overlay");
    if (authOverlay.classList.contains("active")) {
      closeAuthModal();
    }
  }
});


// =============================================
// DATA STORAGE
// each user has their own data saved in localStorage
// the key is "studyBloom_data_" + username
// =============================================

// this object holds all the current user's data
var data = {
  events: [],
  habits: [],
  subjects: []
};

// today's date - we need this for the calendar
var today = new Date();
var calMonth = today.getMonth();
var calYear = today.getFullYear();

// saves the current data to localStorage
// only works if someone is logged in
function save() {
  if (currentUser == null) {
    return; // dont save if nobody is logged in
  }
  localStorage.setItem("studyBloom_data_" + currentUser, JSON.stringify(data));
}


// =============================================
// CARD MODAL (clicking a card opens it bigger)
// =============================================

var overlay = document.getElementById("modal-overlay");
var modalContent = document.getElementById("modal-content");
var activeCard = null;
var cardPlaceholder = null;

// closes the card modal
function closeModal() {
  overlay.classList.add("fade-out");
  var cardToReturn = activeCard;
  var placeholder = cardPlaceholder;

  setTimeout(function() {
    overlay.className = "";
    // put the card back where it was
    if (cardToReturn && placeholder && placeholder.parentNode) {
      placeholder.parentNode.insertBefore(cardToReturn, placeholder);
      placeholder.parentNode.removeChild(placeholder);
    }
    modalContent.innerHTML = "";
    activeCard = null;
    cardPlaceholder = null;
  }, 280);
}

// opens a card in the modal
function openModal(sectionId) {
  var section = document.getElementById(sectionId);
  if (!section) return;

  // create a invisible placeholder so the grid doesn't collapse
  var placeholder = document.createElement("div");
  placeholder.className = "card-placeholder";
  placeholder.style.visibility = "hidden";
  section.parentNode.insertBefore(placeholder, section);

  // clear modal and add the card to it
  modalContent.innerHTML = "";

  // add the X button to close
  var closeBtn = document.createElement("button");
  closeBtn.className = "modal-close-btn";
  closeBtn.innerHTML = "✕";
  closeBtn.onclick = function(e) {
    e.stopPropagation();
    closeModal();
  };
  modalContent.appendChild(closeBtn);
  modalContent.appendChild(section);
  overlay.className = "active";

  activeCard = section;
  cardPlaceholder = placeholder;
}

// when you click on a card in the dashboard, open it in the modal
var dashboard = document.getElementById("dashboard");
dashboard.addEventListener("click", function(e) {
  var card = e.target.closest(".card");
  if (!card || !dashboard.contains(card)) return;

  // dont open modal if clicking buttons or inputs inside the card
  var tag = e.target.tagName.toLowerCase();
  if (tag == "button" || tag == "input" || tag == "select" || tag == "a") return;
  if (e.target.closest("button") || e.target.closest("input") || e.target.closest("select") || e.target.closest("a")) return;

  openModal(card.id);
});

// clicking the dark overlay closes the modal
overlay.onclick = function(e) {
  if (e.target == overlay) {
    closeModal();
  }
};

// pressing Escape closes the modal
document.addEventListener("keydown", function(e) {
  if (e.key == "Escape" && overlay.classList.contains("active")) {
    closeModal();
  }
});


// =============================================
// CALENDAR
// renders the calendar and handles events
// =============================================

function renderCalendar() {
  // array of month names
  var months = ["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE",
                "JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"];

  // update the month/year title
  document.getElementById("cal-month-year").textContent = months[calMonth] + " " + calYear;

  // show today's date
  var now = new Date();
  document.getElementById("cal-today").textContent = now.toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric"
  });

  // figure out what day of the week the month starts on
  var firstDay = new Date(calYear, calMonth, 1).getDay();
  firstDay = (firstDay + 6) % 7; // convert so Monday = 0

  // how many days in this month
  var daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  var body = document.getElementById("calendar-body");
  body.innerHTML = ""; // clear old calendar
  var day = 1;

  // create the rows for the calendar
  for (var row = 0; row < 6; row++) {
    var tr = document.createElement("tr");
    for (var col = 0; col < 7; col++) {
      var td = document.createElement("td");

      if (row == 0 && col < firstDay || day > daysInMonth) {
        // empty cell
        td.textContent = "";
      } else {
        td.textContent = day;

        // highlight today
        if (day == now.getDate() && calMonth == now.getMonth() && calYear == now.getFullYear()) {
          td.className = "today";
        }

        // format the date as YYYY-MM-DD
        var dateStr = calYear + "-" + String(calMonth + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");

        // add any events for this date
        var evts = getEvents(dateStr);
        for (var e = 0; e < evts.length; e++) {
          var span = document.createElement("span");
          span.className = "cal-event " + evts[e].color;
          span.textContent = evts[e].title;
          span.title = "Click to delete";
          span.setAttribute("data-date", dateStr);
          span.setAttribute("data-index", e);
          span.onclick = function(ev) {
            ev.stopPropagation();
            deleteEvent(this.getAttribute("data-date"), parseInt(this.getAttribute("data-index")));
          };
          td.appendChild(span);
        }

        // clicking on a date opens the add event form
        td.setAttribute("data-date", dateStr);
        td.onclick = function() {
          openAddEvent(this.getAttribute("data-date"));
        };

        day++;
      }
      tr.appendChild(td);
    }
    body.appendChild(tr);
    if (day > daysInMonth) break;
  }
}

// returns all events for a specific date
function getEvents(dateStr) {
  var result = [];
  for (var i = 0; i < data.events.length; i++) {
    if (data.events[i].date == dateStr) {
      result.push(data.events[i]);
    }
  }
  return result;
}

// deletes an event
function deleteEvent(dateStr, idx) {
  var count = 0;
  for (var i = 0; i < data.events.length; i++) {
    if (data.events[i].date == dateStr) {
      if (count == idx) {
        data.events.splice(i, 1);
        save();
        renderCalendar();
        return;
      }
      count++;
    }
  }
}

var selectedDate = ""; // the date user clicked on

// shows the add event form
function openAddEvent(dateStr) {
  selectedDate = dateStr;
  document.getElementById("event-date-label").textContent = dateStr;
  document.getElementById("event-title-input").value = "";
  document.getElementById("add-event-form").style.display = "block";
}

// save event button
document.getElementById("save-event-btn").onclick = function() {
  var title = document.getElementById("event-title-input").value.trim();
  if (title == "") return; // dont save empty title

  var color = document.getElementById("event-color-select").value;
  data.events.push({
    date: selectedDate,
    title: title,
    color: color
  });
  save();
  document.getElementById("add-event-form").style.display = "none";
  renderCalendar();
};

// cancel button on add event form
document.getElementById("cancel-event-btn").onclick = function() {
  document.getElementById("add-event-form").style.display = "none";
};

// previous month button
document.getElementById("prev-month").onclick = function() {
  calMonth = calMonth - 1;
  if (calMonth < 0) {
    calMonth = 11;
    calYear = calYear - 1;
  }
  renderCalendar();
};

// next month button
document.getElementById("next-month").onclick = function() {
  calMonth = calMonth + 1;
  if (calMonth > 11) {
    calMonth = 0;
    calYear = calYear + 1;
  }
  renderCalendar();
};


// =============================================
// HABIT TRACKER
// renders the habit table with checkboxes
// =============================================

function renderHabits() {
  var body = document.getElementById("habit-body");
  body.innerHTML = ""; // clear old habits

  for (var i = 0; i < data.habits.length; i++) {
    var tr = document.createElement("tr");

    // habit name column
    var tdName = document.createElement("td");
    tdName.textContent = data.habits[i].name;
    tr.appendChild(tdName);

    // 7 days columns (Mon to Sun)
    for (var d = 0; d < 7; d++) {
      var td = document.createElement("td");
      var btn = document.createElement("button");

      // add checked class if this day is completed
      if (data.habits[i].days[d]) {
        btn.className = "habit-check checked";
        btn.textContent = "✓";
      } else {
        btn.className = "habit-check";
        btn.textContent = "";
      }

      btn.setAttribute("data-habit", i);
      btn.setAttribute("data-day", d);

      // toggle the checkmark when clicked
      btn.onclick = function() {
        var hi = parseInt(this.getAttribute("data-habit"));
        var di = parseInt(this.getAttribute("data-day"));
        if (data.habits[hi].days[di]) {
          data.habits[hi].days[di] = 0;
        } else {
          data.habits[hi].days[di] = 1;
        }
        save();
        renderHabits();
      };

      td.appendChild(btn);
      tr.appendChild(td);
    }

    // delete button column
    var tdDel = document.createElement("td");
    var delBtn = document.createElement("button");
    delBtn.className = "delete-habit-btn";
    delBtn.textContent = "✕";
    delBtn.setAttribute("data-habit", i);
    delBtn.onclick = function() {
      var index = parseInt(this.getAttribute("data-habit"));
      data.habits.splice(index, 1);
      save();
      renderHabits();
    };
    tdDel.appendChild(delBtn);
    tr.appendChild(tdDel);

    body.appendChild(tr);
  }
}

// add new habit button
document.getElementById("add-habit-btn").onclick = function() {
  var name = document.getElementById("new-habit-input").value.trim();
  if (name == "") return; // dont add empty habit

  data.habits.push({
    name: name,
    days: [0,0,0,0,0,0,0]
  });
  save();
  document.getElementById("new-habit-input").value = "";
  renderHabits();
};


// =============================================
// SUBJECT PROGRESS
// shows progress bars for each subject
// =============================================

// colors for the progress bars - they cycle through these
var subjectColors = ["#d4b8e0", "#b8e0c8", "#f2c6d0", "#f5e6a3", "#c8d4e0", "#e0c8b8"];

function renderSubjects() {
  var list = document.getElementById("subject-list");
  list.innerHTML = ""; // clear old subjects

  for (var i = 0; i < data.subjects.length; i++) {
    var s = data.subjects[i];

    // calculate the percentage
    var pct = Math.round((s.done / s.total) * 100);

    var div = document.createElement("div");
    div.className = "subject-item";

    // build the HTML for each subject card
    var html = "";
    html += '<div class="subject-btns">';
    html +=   '<button class="sub-up" data-i="' + i + '" title="+1">▲</button>';
    html +=   '<button class="sub-down" data-i="' + i + '" title="-1">▼</button>';
    html +=   '<button class="sub-del" data-i="' + i + '" title="Delete">✕</button>';
    html += '</div>';
    html += '<h4>' + s.name + ' <span>' + pct + '%</span></h4>';
    html += '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%;background:' + s.color + '"></div></div>';
    html += '<div class="subject-detail">' + s.done + '/' + s.total + '</div>';

    div.innerHTML = html;
    list.appendChild(div);
  }

  // add click handlers for the up buttons
  var upBtns = document.querySelectorAll(".sub-up");
  for (var j = 0; j < upBtns.length; j++) {
    upBtns[j].onclick = function() {
      var idx = parseInt(this.getAttribute("data-i"));
      if (data.subjects[idx].done < data.subjects[idx].total) {
        data.subjects[idx].done = data.subjects[idx].done + 1;
        save();
        renderSubjects();
      }
    };
  }

  // add click handlers for the down buttons
  var downBtns = document.querySelectorAll(".sub-down");
  for (var m = 0; m < downBtns.length; m++) {
    downBtns[m].onclick = function() {
      var idx = parseInt(this.getAttribute("data-i"));
      if (data.subjects[idx].done > 0) {
        data.subjects[idx].done = data.subjects[idx].done - 1;
        save();
        renderSubjects();
      }
    };
  }

  // add click handlers for the delete buttons
  var delBtns = document.querySelectorAll(".sub-del");
  for (var k = 0; k < delBtns.length; k++) {
    delBtns[k].onclick = function() {
      var idx = parseInt(this.getAttribute("data-i"));
      data.subjects.splice(idx, 1);
      save();
      renderSubjects();
    };
  }
}

// add new subject button
document.getElementById("add-subject-btn").onclick = function() {
  var name = document.getElementById("new-subject-name").value.trim();
  var total = parseInt(document.getElementById("new-subject-total").value);
  if (!total || total < 1) total = 1; // default to 1 if invalid
  if (name == "") return;

  // pick a color from the array (cycles through)
  var color = subjectColors[data.subjects.length % subjectColors.length];

  data.subjects.push({
    name: name,
    done: 0,
    total: total,
    color: color
  });
  save();

  // clear the input fields
  document.getElementById("new-subject-name").value = "";
  document.getElementById("new-subject-total").value = "";
  renderSubjects();
};


// =============================================
// MOTIVATIONAL QUOTES
// shows random quotes to keep users motivated :)
// =============================================

var quotes = [
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Success is not final, failure is not fatal.", author: "Winston Churchill" },
  { text: "Education is the most powerful weapon.", author: "Nelson Mandela" },
  { text: "The beautiful thing about learning is nobody can take it from you.", author: "B.B. King" },
  { text: "Study hard, for the well is deep.", author: "Richard Baxter" },
  { text: "Push yourself, because no one else is going to do it.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" }
];

// shows a random quote
function showQuote() {
  var randomIndex = Math.floor(Math.random() * quotes.length);
  var quote = quotes[randomIndex];
  document.getElementById("quote-text").textContent = '"' + quote.text + '"';
  document.getElementById("quote-author").textContent = "– " + quote.author;
}

// new quote button
document.getElementById("new-quote-btn").onclick = showQuote;


// =============================================
// INITIALIZATION
// this runs when the page first loads
// =============================================

// renders all the dashboard components
function initDashboard() {
  renderCalendar();
  renderHabits();
  renderSubjects();
  showQuote();
}

// adds the welcome message to the page
// (shown when user is not logged in)
function addWelcomeMessage() {
  var existing = document.getElementById("welcome-message");
  if (existing) return; // dont add it twice

  var msg = document.createElement("div");
  msg.id = "welcome-message";
  msg.className = "welcome-message";
  msg.innerHTML = '<h2>✿ Welcome to Study Bloom ✿</h2>' +
                  '<p>Please <strong>Log In</strong> or <strong>Sign Up</strong> to access your personalized dashboard.</p>';

  // add it after the dashboard div
  var dashboardEl = document.getElementById("dashboard");
  dashboardEl.parentNode.insertBefore(msg, dashboardEl.nextSibling);
}


// ---- STARTING THE APP ----
// this code runs automatically when the page loads

addWelcomeMessage();

// check if user was previously logged in
var savedSession = localStorage.getItem("studyBloom_session");
if (savedSession) {
  var users = getUsers();
  if (users[savedSession]) {
    // session is valid, log them back in
    loginAs(savedSession);
  } else {
    // session is invalid (maybe user was deleted?), clear it
    localStorage.removeItem("studyBloom_session");
    updateAuthUI();
    showQuote();
  }
} else {
  // nobody is logged in
  updateAuthUI();
  showQuote();
}

console.log("Study Bloom loaded successfully!");
