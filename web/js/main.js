const TX_TABLE_ENTRY_PREFIX = "tx-table-"

const DAYS_PER_MONTH = {
    0: 0,
    1: 31,
    2: 59,
    3: 90,
    4: 120,
    5: 151,
    6: 181,
    7: 212,
    8: 243,
    9: 273,
    10: 304,
    11: 334
}

const TH = "th"
const DAY_SUFFIXES = {
    0: TH,
    1: "st",
    2: "nd",
    3: "rd",
    4: TH,
    5: TH,
    6: TH,
    7: TH,
    8: TH,
    9: TH,
    0: TH
}

function getDateString()
{
    let date = new Date();
    let monthStr = String(date.getMonth()+1).padStart(2,'0');
    let dayStr = String(date.getDate()).padStart(2,'0')
    
    return `${monthStr}/${dayStr}/${date.getFullYear()}`;
}

function calcDailyPushups(date)
{
    // Get date information
    let month = date.getMonth();
    let day = date.getDate();
    let year = date.getFullYear();
    console.log(day);

    // Calculate based on months passed + days passed this month
    let numPushups = DAYS_PER_MONTH[month] + day;

    // Check for leap year
    // If divisible by 4 and not a century year, it's a leap year. If it's a century year, only century years divisible by 400 are leap years. 
    if (((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0))
    {
        numPushups += 1;
    }

    return numPushups;
}

function populateDailyCounter(dailyPushups, dateStr)
{
    let puCountElt = document.getElementById("pu-count");
    puCountElt.innerText = dailyPushups;
    
    let dateStrElt = document.getElementById("current-date");
    dateStrElt.innerText = dateStr;

    let progressBarElt = document.getElementById("progress-bar");
    progressBarElt.style.width = `${100 * (dailyPushups / 365)}%`; // TODO: Account for leap year
}

function createTxTableElt(id, user, amount, date)
{
    var txEltID = TX_TABLE_ENTRY_PREFIX + id; 

    var userCol = document.createElement('td');
    userCol.innerText = user;
    var amountCol = document.createElement('td');
    amountCol.innerText = amount;
    var dateCol = document.createElement('td');
    dateCol.innerText = date;

    var deleteCol = document.createElement('td');
    var deleteButton = document.createElement('input');
    deleteButton.type = "image";
    deleteButton.src = "./img/trash-can-96.png";
    deleteButton.classList.add("float-start", "delete-tx-img");
    deleteButton.addEventListener("click", (event) => {deleteTransaction(event, txEltID)})
    deleteCol.classList.add("delete-tx-col");
    deleteCol.appendChild(deleteButton);


    var tableRow = document.createElement('tr');
    tableRow.id = txEltID
    tableRow.classList.add("text-center")
    tableRow.appendChild(userCol);
    tableRow.appendChild(amountCol);
    tableRow.appendChild(dateCol);
    tableRow.appendChild(deleteCol);

    return tableRow;
}

function populateTxTable(tx_json)
{
    var prevElt = document.getElementById("table-header");
    for (var tx of tx_json)
    {
        var tableRow = createTxTableElt(tx['id'], tx['user'], tx['amount'], tx['date'])
        prevElt.insertAdjacentElement('afterend', tableRow);
        prevElt = tableRow;
    }
}

function createCardDiv(user, balance, img_path)
{
    // Create all elements needed for card div
    let cardDiv = document.createElement('div');
    cardDiv.classList.add('card', 'col-sm', 'px-0');

    let imgDiv = document.createElement('img');
    imgDiv.classList.add('card-img-top');
    imgDiv.alt = "Card image";
    imgDiv.src = img_path;

    let cardBodyDiv = document.createElement('div');
    cardBodyDiv.classList.add('card-body', 'text-center');

    let nameHeader = document.createElement('h4');
    nameHeader.classList.add('card-title');
    nameHeader.innerText = user;

    let cardBalance = document.createElement('p');
    cardBalance.classList.add('card-text');
    cardBalance.innerText = balance;
    cardBalance.id = `${user}-card-balance`;

    let form = document.createElement('form');

    let txDiv = document.createElement('div');
    txDiv.classList.add('input-group', 'mb-3');

    let txInput = document.createElement('input');
    txInput.id = "addTxInput"
    txInput.name = "addTxInput"
    txInput.classList.add('form-control');
    txInput.type = 'text';
    txInput.placeholder = 'Enter pushups';

    let submitButton = document.createElement('button');
    submitButton.classList.add('btn', 'btn-success')
    submitButton.type = 'submit';
    submitButton.innerText = 'Submit';

    // Slap it all together
    txDiv.appendChild(txInput);
    txDiv.appendChild(submitButton);

    form.appendChild(txDiv);
    form.addEventListener("submit", (event) => {submitTransaction(event, user)});

    cardBodyDiv.appendChild(nameHeader);
    cardBodyDiv.appendChild(cardBalance);
    cardBodyDiv.appendChild(form);

    cardDiv.appendChild(imgDiv);
    cardDiv.appendChild(cardBodyDiv);

    return cardDiv;
}

function populateUserCards()
{
    var userRowDiv = document.getElementById("row2");
    
    // Ensure all existing cards are cleared (in case this is not the first call)
    var i = 0;
    while(i < userRowDiv.children.length)
    {
        if (userRowDiv.children[i].classList.contains('card'))
            userRowDiv.children[i].remove();
        else
            i++;
    }

    // Fetch known user data
    fetch("http://" + location.host + "/users",{
        method: "GET"
    }).then((response) => response.json())
    .then((json) => {
        for (var user of json)
        {
            let cardDiv = createCardDiv(user['name'], user['balance'], "./img/tom.jpeg"); // TODO: Add img url to database
            userRowDiv.insertAdjacentElement('afterbegin', cardDiv);
        } 
    })
    .catch((error) => {
       console.log(error);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initialize();
})

function initialize()
{
    // Get current date, calculate daily push-up count
    let date = new Date();
    let dailyPushups = calcDailyPushups(date);
    let dateStr = date.toLocaleString('default', { month: 'long'}) + " " + date.getDate() + DAY_SUFFIXES[(date.getDate() % 10)] + ", " + date.getFullYear();
    populateDailyCounter(dailyPushups, dateStr)


    // Fill transactions table
    fetch("http://" + location.host + "/transactions",{
        method: "GET"
    }).then((response) => response.json())
    .then((json) => {
        populateTxTable(json);
    })
    .catch((error) => {
       console.log(error);
    });
    

    // Fetch users and populate cards
    populateUserCards()

    // Set event listener for add user button
    let addUserForm = document.getElementById("add-user-form");
    addUserForm.addEventListener("submit", (event) => {addUser(event)});

    let addUserEntryPoint = document.getElementById("add-user-entry-pt");
    addUserEntryPoint.addEventListener("click", (event) => {dynamicUserFormInfo(event)});
}

function submitTransaction(event, user)
{
    event.preventDefault();

    // Extract value from form
    let txAmount = String(event.target.elements["addTxInput"].value).trim(); // TODO: Make IDs constants

    // Confirm is integer
    let integerRegex = new RegExp(/^-?\d+$/);
    if(!integerRegex.test(txAmount))
    {
        alert("NO"); // Toast notif
        return;
    }

    // Convert txAmount to integer
    let txInt = Number(txAmount);
    
    // Send transaction to database
    fetch("http://" + location.host + "/add_transaction",{
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({user: user, amount: txInt}) // TODO: functionalize to make standard
    }).then((response) => {
        if (Math.floor(response.status / 100) !== 2)
            alert(`Non-200 error code ${response.status} in successful fetch`);
        else 
            return response.json();
    }).then((json) => {
        // Clear submission box
        event.target.elements["addTxInput"].value = "";

        // If we base updates on current value of an elements inner text, there's nothing stopping someone from
        // editing html then submitting transaction and everything gets messed up because they've messed with innerText 
        // We should refetch current value from backend for user (need endpoint updates)
            // And we should probably store latest known transaction and add endpoint (or modify existing)
            // to take in tx id and get all tx with id greater so we can update

        // Update number counter (mirror until refresh for now)
        let balanceElt = document.getElementById(`${user}-card-balance`);
        balanceElt.innerText = Number(balanceElt.innerText) + txInt; // TODO: Absolutely needs to change 

        // Update tx list
        let dateStr = getDateString();
        let tableEntryElt = createTxTableElt(json['id'], user, txInt, dateStr);
        let tableHeaderElt = document.getElementById("table-header");
        tableHeaderElt.insertAdjacentElement('afterend', tableEntryElt);

        // TODO: Toast notif saying transaction submitted
    })
    .catch((error) => {
        // Toast notif
        
    });

    console.log(JSON.stringify({user: user, amount: txInt}));

}

function dynamicUserFormInfo(event)
{
    event.preventDefault();

    // Fill in dynamic form information
    let dateStr = getDateString();
    let numPushups = calcDailyPushups(new Date());
    document.getElementById("add-user-date").innerText = dateStr;
    document.getElementById("add-user-cumsum").innerText = (numPushups * (numPushups + 1)) / 2;
}

function addUser(event)
{
    // TODO: User already exists + code injection
    // code injection?
    event.preventDefault();

    // Get info from form
    let name = event.target.elements['name'].value;
    let balance = event.target.elements['balance'].value;
    let pfpPath = event.target.elements['photo'].value; // TODO
    
    fetch("http://" + location.host + "/add_user",{
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({name: name, balance: balance}) // TODO: functionalize to make standard
    }).then((response) => {
        populateUserCards(); // Refetches users and builds cards

        // TODO: toast notf
    })
    .catch((error) => {
        // TODO: toast notif
    });
}

function deleteTransaction(event, id)
{
    event.preventDefault();

    // Call to remove transaction
    var txId = String(id).split(TX_TABLE_ENTRY_PREFIX).pop();
    fetch("http://" + location.host + `/transactions/${txId}`,{
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
    }).then((response) => {
        if (response.ok)
        {
            // Update transaction table on success
            var txTableRow = document.getElementById(id);
            txTableRow.remove();

            // Refetch user cards (TODO: Get more granular way to refresh single user's info)
            populateUserCards();
        }

        // TODO: Toast notif
    })
    .catch((error) => {
        // TODO: toast notif
    });
}

function spawnToastNotification(msg, level)
{
    
}


