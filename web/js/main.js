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

function populateTxTable(tx_json)
{
    var prevElt = document.getElementById("table-header");
    for (var tx of tx_json)
    {
        var userCol = document.createElement('td');
        userCol.innerText = tx['user'];
        var amountCol = document.createElement('td');
        amountCol.innerText = tx['amount'];
        var dateCol = document.createElement('td');
        dateCol.innerText = tx['date'];

        var tableRow = document.createElement('tr');
        tableRow.appendChild(userCol);
        tableRow.appendChild(amountCol);
        tableRow.appendChild(dateCol);

        // tableElt = createTxTableElt(user, amount, date)

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

function populateUserCards(user_json)
{
    var userRowDiv = document.getElementById("row2");
    for (var user of user_json)
    {
        let cardDiv = createCardDiv(user['name'], user['balance'], "./img/tom.jpeg"); // TODO: Add img url to database
        userRowDiv.insertAdjacentElement('afterbegin', cardDiv);
    }
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
    fetch("http://" + location.host + "/users",{
        method: "GET"
    }).then((response) => response.json())
    .then((json) => {
        populateUserCards(json);
    })
    .catch((error) => {
       console.log(error);
    });

    // Set event listener for add user button
    document.addEventListener("click", (event) => {addUser(event)});
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
        // Assume non-error status? 

        // Clear submission box
        event.target.elements["addTxInput"].value = "";

        // Update tx list and number counter (mirror until refresh for now)


        // Toast notif saying transaction submitted
        
    })
    .catch((error) => {
        // Toast notif
        
    });

    console.log(JSON.stringify({user: user, amount: txInt}));

}

function addUser(event)
{
    // User already exists
}

function spawnToastNotification(msg, level)
{
    
}
