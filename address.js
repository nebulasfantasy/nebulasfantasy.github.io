
// const contractAddress = "n1hvP7fWwweAxzQCLj3tZo3TcRZ7gksCJ3J";// test net after update, data upload
// const mainnet = false;

// const contractAddress = "n1euf1q5Ptf8VxQh2LMJZvSLs4gT6QR29Lx";//74590f054cec9821b7db249fac4b2a5ada63169a814c55dcb6aa100095277b29
// const mainnet = true;


// // after updates 06/13/2018
// const contractAddress = "n1kjf1jqAhxVWpP5QYWWw2NfonwfgSWV9ZZ";//408e13fd9cc9d10f975e88a8dccf48471c0cd1fdf644298b1c392c59cd67c6fe
// const mainnet = true;

// ver 3 contract
const contractAddress = "n1fxMEFYRTEEgNg3FeVuwByxkCpFSLmEcnF";//c0d05389a0f3afc2f4e02e657a345089d2e7cb03f41e5ae77ba79617ee28489c
const mainnet = true;

const AmountOfplayers = 38;

// common function

var network;
var prizePool;
var numberOfAvatars;
var networkCounter = 2;
function isEmpty(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            return false;
    }
    return true;
}


// check the prize pool
function getTotalPrize() {
    var testcontract;
    var callJSONs = {
        from: ownerAddress, // get address string
        to: contractAddress, // get the contract string
        value: "0",
        nonce: 0,
        gasPrice: "200000",
        gasLimit: "1000000",
        contract: testcontract
    }

    // get the token Id owned by the address
    testcontract = { "function": "getPrizePool", "args": "" };
    callJSONs.contract = testcontract;
    neb.api.call(callJSONs)
        .then(function (resp) {
            var data = String(parseInt(JSON.parse(resp.result)) / 1e18);
            if (data !== prizePool){
                prizePool = data;
                $("#pool").show().text(prizePool + " NAS");
               
            }
            // $("#prize").show().text("Total prize pool:  " + String(parseInt(JSON.parse(resp.result)) / 1e18) + " NAS");
            
        }
        )
};


// check the prize pool
function getTotalTokens() {
    var testcontract;
    var callJSONs = {
        from: ownerAddress, // get address string
        to: contractAddress, // get the contract string
        value: "0",
        nonce: 0,
        gasPrice: "200000",
        gasLimit: "1000000",
        contract: testcontract
    }

    // get the token Id owned by the address
    testcontract = { "function": "getTotalTokens", "args": "" };
    callJSONs.contract = testcontract;
    neb.api.call(callJSONs)
        .then(function (resp) {
            var data = resp.result;
            if (data!== numberOfAvatars){
                numberOfAvatars = data;
                // $("#prize").show().text("Total prize pool:  " + String(parseInt(JSON.parse(resp.result)) / 1e18) + " NAS");
                $("#amountAvatars").show().text(numberOfAvatars);
            }
         
        })
};


var networkUpdate = function(e){
    if(isEmpty(e.data.data)==false)
    {   
        var result = "FOUND";
    }
    else{
        var result = "NOT FOUND";   
    }
    console.log(result)

    if(result=="NOT FOUND"){
        networkCounter--;
        if (networkCounter==0){
            $('#network').show().text(result);
            networkCounter = 2;
        }
    }else{ // if found
        networkCounter= 2;
        $('#network').show().text(result);
    }
}



function updateStatus() {
    // post info
    window.postMessage({
        "target": "contentscript",
        "data": {},
        "method": "getAccount",
    }, "*");

    getTotalTokens();
    getTotalPrize();
}


