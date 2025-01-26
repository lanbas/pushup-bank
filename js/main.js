
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

function initialize()
{
    // Fetch user data and display
    getBankAmounts();

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
