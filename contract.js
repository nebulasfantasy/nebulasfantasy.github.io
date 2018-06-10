'use strict';

var Players = function () {
    LocalContractStorage.defineProperties(this, {
        totalTokens: null, // total token numbers that have been created
        owner:null, // game manager
        prizePool:{
            parse: function (value) {
                return new BigNumber(value);
            },
            stringify: function (o) {
                return o.toString(10);
            }
        }, // total prize pool
        totalPlayers:null, // unique players that has been added
        _name:null,
        claimable:null,
        deadline:null,
        drawPrice:{
            parse: function (value) {
                return new BigNumber(value);
            },
            stringify: function (o) {
                return o.toString(10);
            }
        },
        totalAuctions:null,
    });

    LocalContractStorage.defineMapProperties(this, {
        "tokenOwner": null,
        
        "ownedTokensCount": null,
        "tokenApprovals": null,
        // a single player properties
        "playerId":null,
        "playerWin":null,
        "playerGoal":null,
        "playerTime":null,
        "playerTalent":null,
        "playerAmountByMarket":null,
        "playerPrice":{
            parse: function (value) {
                return new BigNumber(value);
            },
            stringify: function (o) {
                return o.toString(10);
            }
        },

        // auctions
        "auctionToken":null,
        "auctionSeller":null,
        "auctionPrice":{
            parse: function (value) {
                return new BigNumber(value);
            },
            stringify: function (o) {
                return o.toString(10);
            }
        },
        "auctionValid":null,
        "auctionBuyer":null,
        // store the data to find 
        "playerInAuction":null,
        
    });
};

Players.prototype = {
    init: function () {
        this.owner = Blockchain.transaction.from;
        this.totalTokens = 0;
        this.totalAuctions = 0;
        this.totalPlayers = 26; // this is how manu unique players that we create, need to be able to modifiy
        this._name ="Players";
        this.prizePool = new BigNumber(0);
        this.claimable = true;
        // this.deadline = new Date('June 14, 2018 15:00:00'); // GMT time 6.14
        this.drawPrice = new BigNumber(0.1);// initial drawing price  // CHANGE TO 0.1 NAS
        
        for(var i=0;i<this.totalPlayers;i++){
            this.playerPrice.set(i,new BigNumber(0.2)); // initial lize the player for 0.2, CHANGE TO 0.2 NAS
        }
    },

    name:function() {
        return this._name;
    },
// get function for local storage
    getTotalTokens:function(){
        return this.totalTokens; // return the user number;
    },

    getPrizePool:function(){
        return this.prizePool; // return the user number;
    },

    getTotalPlayers:function(){
        return this.totalPlayers; // return the user number;
    },

    getOwnerByTokenId:function(id){
        return this.tokenOwner.get(id);
    },

    getDrawPrice:function(){
        return this.drawPrice;
    },

    getPlayerMarketPrice:function(id){
        return this.playerPrice.get(id);
    },

    getPlayersInfoByTokenId: function(tokenId){
        //token Id is an array;
        var data = JSON.parse(tokenId)
        var result=[];
        for (var i=0;i<data.length;i++){
            var id = this.playerId.get(data[i]);
            var win = this.playerWin.get(data[i]);
            var goal = this.playerGoal.get(data[i]);
            var min = this.playerTime.get(data[i]);
            var talent = this.playerTalent.get(data[i]);
            var player =  {
                "id":id,
                "win":win,
                "goal":goal,
                "time":min,
                "talent":talent,
                "owner":this.ownerOf(data[i]),
                
            };
            result.push(player);
        }

        // return a object array
        return result;
    },


//  =============== function to create a new Player =============================
    _createPlayer: function() {// create a random player
        
        var playerId = this._generateNewPlayerId();
        this._initializePlayer(this.totalTokens,playerId);
        return playerId;
    },

    _initializePlayer: function (tokenId,playerId){
        this.playerId.set(tokenId,playerId);
        this.playerWin.set(tokenId,0);
        this.playerGoal.set(tokenId,0);
        this.playerTime.set(tokenId,0);
        var talent = this._generateNewPlayerTalent();
        this.playerTalent.set(tokenId,talent);
        this.playerInAuction.set(tokenId,false);
    },


    _generateNewPlayerId: function() {
        return parseInt(Math.random()*this.totalPlayers);
    },

    _generateNewPlayerTalent:function() {
        var number = parseInt(Math.random()*100);
        if (number>90){
            return 5;
        }
        if ((number<=90)&(number>70)){
            return 4;
        }
        if ((number<=70)&(number>40)){
            return 3;
        }
        if ((number<=40)&(number>10)){
            return 2;
        }
        if ((number<=10)){
            return 1;
        }
    },





    mint: function() {
        // overwrite the mint function, not using tokenId
        var from = Blockchain.transaction.from;
        // need to add payment requirement here
        var value = Blockchain.transaction.value;


        if (this.claimable==false){
            throw new Error("market has been closed");
        }

        if (value.div(1e18).lt(this.drawPrice)){
            throw new Error("not enough NAS to claim");
        }

        var playerId = this._createPlayer(); // return the unique playerId
        this._addTokenTo(from, this.totalTokens);
        this.transferEvent(true, "", from, this.totalTokens);
        
        this.totalTokens = this.totalTokens+1; 
        this.prizePool = this.prizePool.plus(value);
        

        //check the current token price
        var number = new BigNumber(this.totalTokens)
        this.drawPrice = new BigNumber(0.1*(parseInt(this.totalTokens/50)+1));

        return {"playerId":playerId,"talent":this.playerTalent.get(this.totalTokens-1)};
    },



// ========== function to create a specific player
    _createPlayerById: function(playerId) {
        this._initializePlayer(this.totalTokens,playerId);
    },

    mintPlayerById: function(id){
        // overwrite the mint function, not using tokenId
        var from = Blockchain.transaction.from;
        var value = Blockchain.transaction.value;

        var playerId = parseInt(id);

        // set the number of this player by Id
        // var amount = this.playerAmountByMarket.get(playerId);
        // if (amount==null){
        //     var temp = new BigNumber(0.2)
        //     this.playerPrice.set(playerId,temp);
        // }else{
        //     var price = this.playerPrice.get(playerId);
        //     this.playerPrice.set(playerId,price.add(0.02)); // increase by 0.2 every transaction made
        // }

        if (this.claimable==false){
            throw new Error("market has been closed");
        }

        if(playerId>=this.totalPlayers){
            throw new Error("this player does not exist")
        }

        // if(this.playerPrice.get(playerId)){
        //     this.playerPrice.set(playerId,0.2);
        // }


        if (value.div(1e18).lt(this.playerPrice.get(playerId)) ){
            throw new Error("not enough NAS to claim");
        }

        this._createPlayerById(playerId); // return the unique playerId
        this._addTokenTo(from, this.totalTokens);
        this.transferEvent(true, "", from, this.totalTokens);
        this.totalTokens = this.totalTokens+1;

        this.prizePool = this.prizePool.plus(value);

        var price = this.playerPrice.get(playerId);
        this.playerPrice.set(playerId,price.plus(0.02)); // increase by 0.2 every transaction made
        return {"playerId":playerId,"talent":this.playerTalent.get(this.totalTokens-1)};
    },

    getPlayersByOwner:function(owner) { // return the a id array
        var myPlayers = [];
        var counter = 0;
        for (var i=0;i<this.totalTokens;i++) {
            if(this.tokenOwner.get(i) == owner){
                myPlayers[counter]=i;//this.playerId.get(i);
                counter++;
            }
        }
        return myPlayers;
    },

    // player experience points calculation
    getExpPointsByTokenId: function(tokenId){
        if (tokenId < this.totalTokens){
            var win = this.playerWin.get(tokenId);
            var goal = this.playerGoal.get(tokenId);
            var min = this.playerTime.get(tokenId);
            var talent = this.playerTalent.get(tokenId);
            var expPoint = win*100+goal*300+min*talent;
            return expPoint;
        }
        else{
            throw new Error("token does not exist");
        }
    },


    calculatePointsForAllTokens:function(){
        var result = [];
        for (var i=0;i<this.totalTokens;i++){
            result[i] = {"tokenId":i,"points":this.getExpPointsByTokenId(i)};
        }
        return result;
    },


    bubbleSort: function(array) {
         // array = {"tokenId":, "points":}
        var done = false;
        while (!done) {
          done = true;
          for (var i = 1; i < array.length; i += 1) {
            if (array[i - 1].points < array[i].points) {
              done = false;
              var tmp = array[i - 1];
              array[i - 1] = array[i];
              array[i] = tmp;
            }
          }
        }
        return array;
    },




    sortTokensByPoints:function(){
       var result= this.calculatePointsForAllTokens();
       var sortResult = this.bubbleSort(result);
       var top50Owners = [];
       for (var i=0;i<50;i++){
           if (i>=this.totalTokens){
            top50Owners[i] = this.owner; // fill the blank with owner address;
           }
           else{
            top50Owners[i] = this.ownerOf(sortResult[i].tokenId);
           } 
       }
       return top50Owners;
    },


    // implement a method to rank the expPoint
    
//  ================== Game manager-only methods ======================
    increasePlayersNumber: function(addition){
        if(Blockchain.transaction.from!==this.owner){
            throw new Error("you are not game owner")
        }
        this.totalPlayers = this.totalPlayers + addition;
    },

    // return an array of tokensIDs by PlayerId;
    getTokenIdByPlayerId: function(targetPlayer) {
        var foundIDs = [];
        var counter = 0;
        for (var i=0;i<this.totalTokens;i++){
            if (this.playerId.get(i)==targetPlayer){
                foundIDs[counter] = i;
                counter= counter+1;
            }     
        }
        return foundIDs; // this is the token ID
    },

    updatePlayerStatus: function(targetPlayer,addTimes,addWins,addGoals) {
        var from = Blockchain.transaction.from;
        if (from !== this.owner){
            throw new Error("you are not game owner");
        }
        // check if inputs are reaonable
        if(addTimes<0||addTimes>90||addWins<0||addGoals<0){
            throw new Error("updated data is not reasonable");
        }
        else{
            var tokenIds =  this.getTokenIdByPlayerId(targetPlayer);
            var index;
            for (var i=0;i<tokenIds.length;i++){
                index = tokenIds[i];
             this.playerWin.set(index,this.playerWin.get(index)+parseInt(addWins));
             this.playerGoal.set(index,this.playerGoal.get(index)+parseInt(addGoals));
             this.playerTime.set(index,this.playerTime.get(index)+parseInt(addTimes)); // needs to modify here
            }          
        }
        return tokenIds
    },

// trade market
    startAuction:function(tokenId, price) {
        // check ownership
        // increase auction id
        var from = Blockchain.transaction.from;
        var owner = this.ownerOf(tokenId);
        if (from!==owner){
            throw new Error("not the token owner")
        }

        if(this.playerInAuction.get(tokenId)==true){
            throw new Error("this player is already in Auction");
        }

        var AuctionPrice = new BigNumber(price);

        var auctionId = this.totalAuctions;

        this.auctionToken.set(auctionId,tokenId);
        this.auctionSeller.set(auctionId,from);
        this.auctionPrice.set(auctionId,AuctionPrice);
        this.auctionValid.set(auctionId,true);

        this.playerInAuction.set(tokenId,true);
        this.totalAuctions = this.totalAuctions+1;
    },

    stopAuction:function(auctionId){
        if((this.auctionValid.get(auctionId)==false)||(auctionId>this.totalAuctions)){
            throw new Error("not a valid auction Id");
        }

        var from = Blockchain.transaction.from;
        var owner = this.auctionSeller.get(auctionId);
        if (from!==owner){
            throw new Error("not the auction seller")
        }
        this.auctionValid.set(auctionId,false);

        var id = this.auctionToken.get(auctionId);
        this.playerInAuction.set(id,false);
    },

    buyAuction:function(auctionId){
        if((this.auctionValid.get(auctionId)==false)||(auctionId>this.totalAuctions)){
            throw new Error("not a valid auction Id");
        }

        var buyer = Blockchain.transaction.from;
        var value = Blockchain.transaction.value;
        var sellerPrice = this.auctionPrice.get(auctionId);

        if (value.div(1e18).lt(sellerPrice)){
            throw new Error("not enough NAS");
        }

        var seller = this.auctionSeller.get(auctionId);
        var tokenId = this.auctionToken.get(auctionId);
        this._transferFrom(seller, buyer, tokenId);

        this.auctionBuyer.set(auctionId,buyer);
        this.auctionValid.set(auctionId,false);

        var id = this.auctionToken.get(auctionId);
        this.playerInAuction.set(id,false);
    },

    //getter
    getTotalAuctions:function(){
        return this.totalAuctions;
    },

    getValidAuctions:function(){
        var totalAuctionNumber = this.totalAuctions;
        var result = [];
        var counter = 0;
        for(var i=0;i<totalAuctionNumber;i++){
            if(this.auctionValid.get(i)==true){
                result[counter]=i;
                counter++;
            }
        }
        return result;
    },

    getAuctionByIds:function(ids){
        var data = JSON.parse(ids)
        var result=[];
        for (var i=0;i<data.length;i++){
            var id = this.auctionToken.get(data[i]);
            var seller = this.auctionSeller.get(data[i]);
            var price = this.auctionPrice.get(data[i]);
            var valid = this.auctionValid.get(data[i]);
            var buyer = this.auctionBuyer.get(data[i]);
            var auction =  {
                "id":id,
                "seller":seller,
                "price":price,
                "valid":valid,
                "buyer":buyer,
            };
            result.push(auction);
        }

        // return a object array
        return result;
    },

    getValidAuctionByOwner:function(address){
        var totalAuctionNumber = this.totalAuctions;
        var result = [];
        var counter = 0;
        for(var i=0;i<totalAuctionNumber;i++){
            if((this.auctionValid.get(i)==true)&&(this.auctionSeller.get(i)==address)){
                result[counter]=i;
                counter++;
            }
        }
        return result;
    },




//  ================== Prize Pool Management========================
    withdraw: function(amount) { // just in case fund get stucked
        var from = Blockchain.transaction.from;
        if (from !== this.owner){
            throw new Error("your are not the game owner")
        }
        var amountNumber = new BigNumber(amount)

        Blockchain.transfer(from,amountNumber.mul(1e18))
    },

    isClaimable: function(status) {
        var from = Blockchain.transaction.from;
        if (from !== this.owner){
            throw new Error("you are not game owner")
        } 
        this.claimable = status;
    },

    reward:function(){
        var from = Blockchain.transaction.from;
        if (from !== this.owner){
            throw new Error("you are not game owner")
        }

        var pool = this.prizePool;

        var winners = this.sortTokensByPoints();

        var amount=[];
        amount[0]= pool.mul(0.25); // take 25%
        amount[1]= pool.mul(0.15); // take 15%
        amount[2]= pool.mul(0.1);// take 10%

        
        // remaining 15%
        for (var i=3;i<10;i++){
           amount[i] = pool.mul(0.15).div(7);
        }

        // remaining 15%
        for (var i=10;i<30;i++){
        amount[i] = pool.mul(0.15).div(20);
        }

        // remainging 10%
        for (var i=30;i<50;i++){
            amount[i] = pool.mul(0.10).div(20);
        }
        
        var amount_owner = pool.mul(0.1);
        
        Blockchain.transfer(this.owner,amount_owner);


         var result=[];
         for (var i=0;i<50;i++){
            result[i]={"address":winners[i],"amount":amount[i]}
            Blockchain.transfer(winners[i],amount[i]);
         }

        this.prizePool = 0;

        return result;
    },



    balanceOf: function (_owner) {
        var balance = this.ownedTokensCount.get(_owner);
        return balance;
        // if (balance instanceof BigNumber) {
        //     return balance.toString(10);
        // } else {
        //     return "0";
        // }
    },

    ownerOf: function (_tokenId) {
        return this.tokenOwner.get(_tokenId);
    },

    approve: function (_to, _tokenId) {
        var from = Blockchain.transaction.from;

        var owner = this.ownerOf(_tokenId);
        if (_to == owner) {
            throw new Error("invalid address in approve.");
        }
        // msg.sender == owner || isApprovedForAll(owner, msg.sender)
        if (owner == from) {
            this.tokenApprovals.set(_tokenId, _to);
            this.approveEvent(true, owner, _to, _tokenId);
        } else {
            throw new Error("permission denied in approve.");
        }
    },

    getApproved: function (_tokenId) {
        return this.tokenApprovals.get(_tokenId);
    },


    isApprovedOrOwner: function(_spender, _tokenId) {
        var owner = this.ownerOf(_tokenId);
        return _spender == owner || this.getApproved(_tokenId) == _spender || this.isApprovedForAll(owner, _spender);
    },

    _transferFrom: function (_from, _to, _tokenId) {
            this.removeTokenFrom(_from, _tokenId);
            this._addTokenTo(_to, _tokenId);
            this.transferEvent(true, _from, _to, _tokenId); 
    },

    transferFrom: function (_from, _to, _tokenId) {
        var from = Blockchain.transaction.from;
        if (this.isApprovedOrOwner(from, _tokenId)) {
            this.removeTokenFrom(_from, _tokenId);
            this._addTokenTo(_to, _tokenId);
            this.transferEvent(true, _from, _to, _tokenId);
        } else {
            throw new Error("permission denied in transferFrom.");
        }    
    },

    transfer: function ( _to, _tokenId) {
        var from = Blockchain.transaction.from;
        if (from != this.ownerOf(_tokenId)) {
            throw new Error("permission denied in transfer.");
        }
            this.removeTokenFrom(from, _tokenId);
            this._addTokenTo(_to, _tokenId);
            this.transferEvent(true, from, _to, _tokenId);    
    },

    clearApproval: function (_owner, _tokenId) {
        var owner = this.ownerOf(_tokenId);
        if (_owner != owner) {
            throw new Error("permission denied in clearApproval.");
        }
        this.tokenApprovals.del(_tokenId);
    },

    removeTokenFrom: function(_from, _tokenId) {
        if (_from != this.ownerOf(_tokenId)) {
            throw new Error("permission denied in removeTokenFrom.");
        }
        var tokenCount = this.ownedTokensCount.get(_from);
        if (tokenCount<1) {
            throw new Error("Insufficient account balance in removeTokenFrom.");
        }
        this.ownedTokensCount.set(_from, tokenCount-1);
    },

    // this should be a private method
    _addTokenTo: function(_to, _tokenId) {
        this.tokenOwner.set(_tokenId, _to);
        if (this.ownedTokensCount.get(_to)==null){
            var tokenCount = 0
        }else{
            var tokenCount = this.ownedTokensCount.get(_to) ;
        }
        this.ownedTokensCount.set(_to, tokenCount+1);
    },

    transferEvent: function (status, _from, _to, _tokenId) {
        Event.Trigger(this.name(), {
            Status: status,
            Transfer: {
                from: _from,
                to: _to,
                tokenId: _tokenId
            }
        });
    },

    approveEvent: function (status, _owner, _spender, _tokenId) {
        Event.Trigger(this.name(), {
            Status: status,
            Approve: {
                owner: _owner,
                spender: _spender,
                tokenId: _tokenId
            }
        });
    },

};

module.exports = Players;
