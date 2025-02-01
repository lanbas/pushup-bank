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

function calcDailyPushups()
{
    // Get date information
    let date = new Date();
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

if(document.readyState !== 'loading') 
{
    initialize();
}
else 
{
    document.addEventListener('DOMContentLoaded', () => {
        initialize();
    })
}

function placeDailyPushupElement(numPushups)
{
    let pushupDiv = document.createElement("div");
    pushupDiv.id = "pushupDiv";

    let pushupElt = document.createElement("h2");
    pushupElt.innerText = numPushups;
    pushupElt.id = "pushupElt"

    let pushupMsg = document.createElement("p");
    pushupMsg.innerText = "push-ups due today";
    pushupMsg.id = "pushupMsg";

    let title = document.getElementById("title");
    title.insertAdjacentElement('afterend', pushupDiv);
    pushupDiv.appendChild(pushupElt);
    pushupElt.insertAdjacentElement('afterend', pushupMsg);
}

function initialize()
{
    // Fetch user data and display
    getBankAmounts();

    // Calculate number of push-ups required today and display
    let numPushups = calcDailyPushups();
    placeDailyPushupElement(numPushups);

    // Add event listener for form submission
    let additionForm = document.getElementById("additionForm");
    additionForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        let addAmt = document.getElementById("addAmt").value;
        let person = document.getElementById("personList").value;
        if (isNaN(addAmt))
        {
            let errStr = "Numbers only bitch. You gave me: " + addAmt;
            alert(errStr);
            return false;
        }

        fetch("http://" + location.host + "/add", {
            method: "POST",
            body: JSON.stringify({
                name: person,
                amount: addAmt
            }),
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        }).then((res) => {
            if (res.ok)
                getBankAmounts();
            else
            {
                return res.text().then(text => { alert("Got error response when updating data: " + res); })
            }
        });
    })
}

function getBankAmounts()
{
    fetch("http://" + location.host + "/data",{
        method: "GET"
    }).then((response) => response.json())
    .then((json) => {
        for (var [key, value] of Object.entries(json))
        {
            // Update html for each person
            var userHeader = document.getElementById(key + "Amount");
            userHeader.innerText = key + ": " + value;
        }
    })
    .catch((error) => {
        alert(error)
    });
}
