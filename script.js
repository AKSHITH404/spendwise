// ---------- 1. DATA ----------
// Get saved transactions from localStorage (empty list if nothing saved)
var transactions = JSON.parse(localStorage.getItem("transactions"));
if (transactions == null) {
  transactions = [];
}

var editingId = 0;   // 0 = adding new, any other number = editing that ID
var categories = ["Food", "Travel", "Education", "Shopping", "Bills", "Salary", "Entertainment", "Other"];

// Save the list in localStorage
function saveData() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

// Total amount of one type ("Income" or "Expense")
function getTotal(type) {
  var total = 0;
  for (var i = 0; i < transactions.length; i++) {
    if (transactions[i].type == type) {
      total = total + transactions[i].amount;
    }
  }
  return total;
}

// List of different months in the data, like ["2026-09", "2026-10"]
function getMonths() {
  var months = [];
  for (var i = 0; i < transactions.length; i++) {
    var month = transactions[i].date.slice(0, 7);     // YYYY-MM
    if (months.indexOf(month) == -1) {
      months.push(month);
    }
  }
  months.sort();
  return months;
}

// Total of one type in one month
function monthTotal(month, type) {
  var total = 0;
  for (var i = 0; i < transactions.length; i++) {
    if (transactions[i].date.slice(0, 7) == month && transactions[i].type == type) {
      total = total + transactions[i].amount;
    }
  }
  return total;
}

// ---------- 2. ADD / UPDATE ----------
function saveTransaction() {
  var type = document.getElementById("type").value;
  var description = document.getElementById("description").value;
  var amount = Number(document.getElementById("amount").value);
  var category = document.getElementById("category").value;
  var date = document.getElementById("date").value;
  var message = document.getElementById("message");

  // Validation
  if (type == "" || description.trim() == "" || category == "" || date == "") {
    message.style.color = "red";
    message.innerHTML = "Please fill in all the fields.";
    return;
  }
  if (amount <= 0 || isNaN(amount)) {
    message.style.color = "red";
    message.innerHTML = "Amount must be a positive number.";
    return;
  }

  if (editingId == 0) {
    // New transaction: ID is last ID + 1
    var newId = 1;
    if (transactions.length > 0) {
      newId = transactions[transactions.length - 1].id + 1;
    }
    transactions.push({ id: newId, type: type, description: description,
                        amount: amount, category: category, date: date });
    message.innerHTML = "Transaction added successfully!";
  } else {
    // Editing: find the transaction and change its values
    for (var i = 0; i < transactions.length; i++) {
      if (transactions[i].id == editingId) {
        transactions[i].type = type;
        transactions[i].description = description;
        transactions[i].amount = amount;
        transactions[i].category = category;
        transactions[i].date = date;
      }
    }
    message.innerHTML = "Transaction updated successfully!";
    editingId = 0;
    document.getElementById("formTitle").innerHTML = "Add Transaction";
    document.getElementById("saveBtn").innerHTML = "Add Transaction";
  }
  message.style.color = "green";

  saveData();
  clearForm();
  showAll();
}

// Empty the form fields
function clearForm() {
  document.getElementById("type").value = "";
  document.getElementById("description").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("category").value = "";
  document.getElementById("date").value = new Date().toISOString().slice(0, 10);  // today
}

// ---------- 3. EDIT / DELETE / CLEAR ----------
function editTransaction(id) {
  for (var i = 0; i < transactions.length; i++) {
    if (transactions[i].id == id) {
      document.getElementById("type").value = transactions[i].type;
      document.getElementById("description").value = transactions[i].description;
      document.getElementById("amount").value = transactions[i].amount;
      document.getElementById("category").value = transactions[i].category;
      document.getElementById("date").value = transactions[i].date;
    }
  }
  editingId = id;
  document.getElementById("formTitle").innerHTML = "Edit Transaction";
  document.getElementById("saveBtn").innerHTML = "Update Transaction";
  document.getElementById("message").innerHTML = "";
  window.location.href = "#add";      // go to the form
}

function deleteTransaction(id) {
  if (confirm("Are you sure you want to delete this transaction?")) {
    // Keep every transaction except the one with this ID
    transactions = transactions.filter(function (t) { return t.id != id; });
    saveData();
    showAll();
  }
}

function clearAll() {
  if (confirm("Delete ALL transactions?")) {
    transactions = [];
    saveData();
    showAll();
  }
}

// ---------- 4. SHOW DATA ON THE PAGE ----------
// Dashboard: totals, 5 recent transactions, monthly expenses
function showDashboard() {
  var income = getTotal("Income");
  var expense = getTotal("Expense");
  document.getElementById("totalIncome").innerHTML = "₹" + income;
  document.getElementById("totalExpense").innerHTML = "₹" + expense;
  document.getElementById("balance").innerHTML = "₹" + (income - expense);

  // Copy the list and sort it with newest date first
  var sorted = transactions.slice();
  sorted.sort(function (a, b) { return a.date < b.date ? 1 : -1; });

  var html = "";
  for (var i = 0; i < sorted.length && i < 5; i++) {      // only first 5
    var t = sorted[i];
    html += "<tr><td>" + t.description + "</td><td>" + t.type + "</td><td>₹" +
            t.amount + "</td><td>" + t.date + "</td></tr>";
  }
  if (html == "") {
    html = "<tr><td colspan='4'>No transactions yet.</td></tr>";
  }
  document.getElementById("recentBody").innerHTML = html;

  var months = getMonths();
  var monthHtml = "";
  for (var j = 0; j < months.length; j++) {
    monthHtml += "<tr><td>" + months[j] + "</td><td>₹" + monthTotal(months[j], "Expense") + "</td></tr>";
  }
  if (monthHtml == "") {
    monthHtml = "<tr><td colspan='2'>No data yet.</td></tr>";
  }
  document.getElementById("dashMonthBody").innerHTML = monthHtml;
}

// Transactions table with search, filter and sort
function showTable() {
  var search = document.getElementById("search").value.toLowerCase();
  var filterType = document.getElementById("filterType").value;
  var filterCategory = document.getElementById("filterCategory").value;
  var sortOrder = document.getElementById("sortOrder").value;

  var list = [];
  for (var i = 0; i < transactions.length; i++) {
    var t = transactions[i];
    var matchSearch = t.description.toLowerCase().indexOf(search) != -1;
    var matchType = (filterType == "All" || t.type == filterType);
    var matchCategory = (filterCategory == "All" || t.category == filterCategory);
    if (matchSearch && matchType && matchCategory) {
      list.push(t);
    }
  }

  list.sort(function (a, b) {
    if (sortOrder == "newest") { return a.date < b.date ? 1 : -1; }
    return a.date > b.date ? 1 : -1;
  });

  var html = "";
  for (var j = 0; j < list.length; j++) {
    var item = list[j];
    var colour = (item.type == "Income") ? "greenText" : "redText";
    html += "<tr>" +
      "<td>" + item.id + "</td>" +
      "<td>" + item.description + "</td>" +
      "<td class='" + colour + "'>" + item.type + "</td>" +
      "<td>" + item.category + "</td>" +
      "<td class='" + colour + "'>₹" + item.amount + "</td>" +
      "<td>" + item.date + "</td>" +
      "<td><button class='editBtn' onclick='editTransaction(" + item.id + ")'>Edit</button> " +
      "<button class='deleteBtn' onclick='deleteTransaction(" + item.id + ")'>Delete</button></td>" +
      "</tr>";
  }
  if (html == "") {
    html = "<tr><td colspan='7'>No transactions found.</td></tr>";
  }
  document.getElementById("tableBody").innerHTML = html;
}

// Reports: totals, category-wise expenses, monthly summary
function showReports() {
  var income = getTotal("Income");
  var expense = getTotal("Expense");
  document.getElementById("repIncome").innerHTML = "₹" + income;
  document.getElementById("repExpense").innerHTML = "₹" + expense;
  document.getElementById("repBalance").innerHTML = "₹" + (income - expense);

  // Category-wise expenses
  var catHtml = "";
  for (var i = 0; i < categories.length; i++) {
    var total = 0;
    for (var j = 0; j < transactions.length; j++) {
      if (transactions[j].type == "Expense" && transactions[j].category == categories[i]) {
        total = total + transactions[j].amount;
      }
    }
    if (total > 0) {
      catHtml += "<tr><td>" + categories[i] + "</td><td>₹" + total + "</td></tr>";
    }
  }
  if (catHtml == "") {
    catHtml = "<tr><td colspan='2'>No expenses yet.</td></tr>";
  }
  document.getElementById("categoryBody").innerHTML = catHtml;

  // Monthly summary
  var months = getMonths();
  var monthHtml = "";
  for (var k = 0; k < months.length; k++) {
    monthHtml += "<tr><td>" + months[k] + "</td><td>₹" + monthTotal(months[k], "Income") +
                 "</td><td>₹" + monthTotal(months[k], "Expense") + "</td></tr>";
  }
  if (monthHtml == "") {
    monthHtml = "<tr><td colspan='3'>No data yet.</td></tr>";
  }
  document.getElementById("monthBody").innerHTML = monthHtml;
}

// Update everything on the page
function showAll() {
  showDashboard();
  showTable();
  showReports();
}

// ---------- 5. START ----------
clearForm();
showAll();
