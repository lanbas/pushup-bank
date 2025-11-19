const TX_TABLE_ENTRY_PREFIX = "tx-table-"

const DEFAULT_PROFILE_PIC = "./img/default_pfp.png"

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

function createCardDiv(user, balance, img)
{
    //img-wrapper + img + img-overlay (which includes button)
    // Create all elements needed for card div
    let cardDiv = document.createElement('div');
    cardDiv.classList.add('card', 'col-sm-3', 'px-0');
    cardDiv.id = `card-${user}`;

    let imgDiv = document.createElement('img');
    imgDiv.classList.add('card-img-top');
    imgDiv.alt = "Card image";
    imgDiv.src = `data:image/png;base64,${img}`

    let cardBodyDiv = document.createElement('div');
    cardBodyDiv.classList.add('card-body', 'text-center');

    let nameHeader = document.createElement('h4');
    nameHeader.classList.add('card-title', 'text-wrap');
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
    txInput.required = true;
    txInput.pattern = "-?[0-9]+";
    txInput.addEventListener("input", (event) => {
        if (txInput.validity.patternMismatch)
            txInput.setCustomValidity("Please enter a positive or negative whole number.");
        else
            txInput.setCustomValidity("");
    });

    let submitButton = document.createElement('button');
    submitButton.classList.add('btn', 'btn-success')
    submitButton.type = 'submit';
    submitButton.innerText = 'Submit';

    let deleteUserBtn = document.createElement('a');
    deleteUserBtn.classList.add('delete-user');
    deleteUserBtn.innerText = "Delete User";
    deleteUserBtn.addEventListener("click", (event) => {deleteUser(event, user)});

    // Slap it all together
    txDiv.appendChild(txInput);
    txDiv.appendChild(submitButton);

    form.appendChild(txDiv);
    form.addEventListener("submit", (event) => {submitTransaction(event, user)});

    cardBodyDiv.appendChild(nameHeader);
    cardBodyDiv.appendChild(cardBalance);
    cardBodyDiv.appendChild(form);
    cardBodyDiv.appendChild(deleteUserBtn);

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
            // TODO: Use returned photo from backend
            let cardDiv = createCardDiv(user['name'], user['balance'], user['photo']);
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

    // Setup user modal form validation
    let userNameElt = document.getElementById("add-user-name");
    userNameElt.addEventListener("input", (event) => {
        if (userNameElt.validity.patternMismatch)
            userNameElt.setCustomValidity("Please enter an alphabetical name (less than 32 characters).");
        else 
            userNameElt.setCustomValidity("");
    })

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

// TODO: Handle required fields, handle when missing optional fields
function addUser(event)
{
    // TODO: Check for user already exists + sanitize fields?
    // code injection?
    event.preventDefault();

    // Setup reader and do all request work in reader callback
    // TODO: Is this really the only way to do this? Seems like I can't even await because it doesn't return a promise, it's in result attribute
    let reader = new FileReader();
    let formData = new FormData();
    let name = event.target.elements['name'].value;
    let balance = event.target.elements['balance'].value ? event.target.elements['balance'].value : 0;
    formData.append("name", name);
    formData.append("balance", balance);


    reader.addEventListener("load", () => {
        let photo = reader.result.split(',')[1]; // Remove data:image/{type};base64, leading content

        // Add photo to form
        formData.append("photo", photo);

        // Send form as request
        fetch("http://" + location.host + "/add_user",{
            method: "POST",
            body: formData
        }).then((response) => {
            console.log(response);
            populateUserCards(); // Refetches users and builds cards

            // TODO: toast notif
        })
        .catch((error) => {
            console.log(error);
            // TODO: toast notif
        });
    })

    let photoBlob = event.target.elements['photo'].files[0];
    if (photoBlob)
        reader.readAsDataURL(photoBlob);
    else 
    {
        // Send form as request
        fetch("http://" + location.host + "/add_user",{
            method: "POST",
            body: formData
        }).then((response) => {
            console.log(response);
            populateUserCards(); // Refetches users and builds cards

            // TODO: toast notif
        })
        .catch((error) => {
            console.log(error);
            // TODO: toast notif
        });
    }
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

function deleteUser(event, user)
{
    event.preventDefault();

    fetch("http://" + location.host + `/users/${user}`,{
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        }
    }).then((response) => {
        if (Math.floor(response.status / 100) !== 2)
            alert(`Non-200 error code ${response.status} in successful fetch`);
        else 
            return response.json();
    }).then((json) => {
        // Remove user card
        var card = document.getElementById(`card-${user}`);
        card.remove();

        // Reload transaction table, which has been cleared of deleted user transactions
        fetch("http://" + location.host + "/transactions",{
            method: "GET"
        }).then((response) => response.json())
        .then((json) => {
            let table = document.getElementById('tx-table').firstElementChild.firstElementChild;
            while(table.children.length > 1)
            {
                table.children.item(1).remove(); // TODO: Improve ID or other attached info to allow deletion of only transactions belonging to deleted user
            }

            populateTxTable(json);
        })
        .catch((error) => {
            console.log(error);
        });
    });
}

function spawnToastNotification(msg, level)
{
    
}


