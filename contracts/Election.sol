// SPDX-License-Identifier : MIT
pragma solidity >=0.4.22 <=0.8.17;

contract Election {

    // Model a Candidate
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    // Store accounts that have voted
    mapping(address => bool) public voters;

    // Store candidates
    // Fetch candidates
    mapping(uint256 => Candidate) public candidates;

    // Store candidates count

    uint256 public candidatesCount; // default for uint256 = 0

    event votedEvent(
        uint256 indexed _candidateId
    );

    function addCandidate(string memory _name) private { //_name is a local variable
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
    }

    constructor () public {
        addCandidate("Candidate 1");
        addCandidate("Candidate 2");
    }

    function vote (uint256 _candidateId) public { // this function will create a transaction.

        // require that they haven't voted before
        require(!voters[msg.sender]); // require that msg.sender address is not in voters mapping

        //require a valid candidate
        require(_candidateId>0 && _candidateId <= candidatesCount);

        // record that voter has voted
        // addition to arguments, when function is called some meta-data is also sent.
        voters[msg.sender] = true;

        // update candidate vote count
        candidates[_candidateId].voteCount++;

        //trigger voted event
        emit votedEvent(_candidateId);
    }
}