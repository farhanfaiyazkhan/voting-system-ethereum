App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,

  init: function() {
    return App.initWeb3();
  },


  // from a high level, it means that we are going to use the web3 library to connect to the blockchain
  initWeb3: function() {
    // TODO: refactor conditional
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      // Metamask is a chrome extension that allows you to connect to the blockchain
      const ethEnabled = () => {
        if(window.ethereum) {
          window.web3 = new Web3(window.ethereum);
          return true;
        }
        return false;
      }
      if (!ethEnabled()) {
        alert("Install Ethereum-compatible browser or extension like meta-mask.");
      }
      web3 = window.web3;
      App.web3Provider = web3.currentProvider;
    } else {
      // Specify default instance if no web3 instance provided
      // This is the local blockchain that we are going to use for development
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  // This is the function that is going to load the smart contract
  initContract: function() {
    $.getJSON("Election.json", function(election) {
      // Instantiate a new truffle contract from the artifact
      // Truffle contract is the actual contract that we are going to use to interact with the blockchain
      App.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);

      App.listenForEvents();
      return App.render();
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function () {
    App.contracts.Election.deployed().then(function (instance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with Metamask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      instance
        .votedEvent(
          {},
          {
            fromBlock: 0,
            toBlock: 'latest',
          }
        )
        .watch(function (error, event) {
          console.log('event triggered', event);
          // Reload when a new vote is recorded
          App.render();
        });
    });
  },

  render: async () => {
    var electionInstance;
    var loader = $("#loader");
    var content = $("#content");

    // Asynchronous execution thus need to show and hide.
    loader.show();
    content.hide();

    // Load account data
    // getCoinbase will get the account that is currently logged in
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      App.account = accounts[0];
      $("#accountAddress").html("Your Account: " + App.account);
    } catch (error) {
      if(error.code === 4001) {
        // User rejected request
      }
      console.log(error);
    }

    // Load contract data
    // List out the candidates and the number of votes that they have.
    App.contracts.Election.deployed().then(function(instance) {
      electionInstance = instance;
      return electionInstance.candidatesCount();
    }).then(async (candidatesCount) => {
      const promise = [];
      for( var i =1; i <= candidatesCount; i++) {
        promise.push(electionInstance.candidates(i));
      }

      const candidates = await Promise.all(promise);
      var candidatesResults = $("#candidatesResults");
      candidatesResults.empty();

      var candidatesSelect = $("#candidatesSelect");
      candidatesSelect.empty();

      for (var i = 1; i <= candidatesCount; i++) {
          var id = candidates[i][0];
          var name = candidates[i][1];
          var voteCount = candidates[i][2];

          // Render candidate Result
          var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
          candidatesResults.append(candidateTemplate);

          // Render candidate ballot option
          var candidateOption = "<option value='" + id + "'>" + name + "</option>";
          candidatesSelect.append(candidateOption);
        }
        return electionInstance.voters(App.accounts);
      }).then(function(hasVoted) {
        // Do not allow a user to vote.
        if(hasVoted) {
          $("form").hide();
        }
        loader.hide();
        content.show();
      }).catch(function(error) {
      console.error(error);
    });
  },

  castVote: function () {
    var candidateId = $("candidatesSelect").val();
    App.contracts.Election.deployed().then(function (instance) {
      return instance.vote(candidateId, {from: App.account});
    }).then(function (result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function (err) {
      console.error(err);
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});