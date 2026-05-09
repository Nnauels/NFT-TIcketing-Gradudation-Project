// SPDX-License-Identifier: None
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol"; //added this
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "hardhat/console.sol";


/// @custom:security-contact @Bigbadbeard
 contract EventTicketing is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable, AccessControl, IERC721Receiver {
    using Counters for Counters.Counter;

    Counters.Counter private _seatIdCounter;

    //setting up the event
    uint256 public maxTickets;
    string public eventLocation;
    uint256 public eventTime;
    string public eventName;
    uint256 public cost;

    //setting up the ticket scanner role
    bytes32 public constant TICKET_SCANNER_ROLE = keccak256("TICKET_SCANNER_ROLE");
    mapping(address => uint256) public ticketScannerAddresses;

    //setting up ticket struct and related info
    struct Ticket {
        uint256 seatNumber; // Seat number
        uint256 cost; // Cost to buy
        uint256 date; // Date for ticket, this will be stored as a timestamp
        bool hasBeenScanned; // Boolean variable indicating if the ticket has been used
        bool isValid; // Boolean variable for if ticket has passed event date
        address purchaser; // Wallet address of the purchaser (0=not sold yet)
    }

    // Create tickets for this event
    mapping(uint256 => Ticket) public tickets;

    //Emit an event every time a ticket is scanned
    event TicketScanned(uint256 ticketId, address scanner);

    //Emit an event every time a ticket is revoked
    event TicketRevoked(uint256 ticketId);

    // Emit an event every time a ticket is created
    event TicketCreated(uint256 ticketId, address creator);

    // Emit an event every time a ticket is purchased
    event TicketBought(uint256 ticketId, address buyer);


    // This contract sets up the event
    constructor(uint256 _maxTickets, string memory _eventLocation, string memory _eventName, uint256 _eventTime) ERC721("EventTicketing", "EVTK") {
        maxTickets = _maxTickets;
        eventLocation = _eventLocation;
        eventTime = _eventTime;
        eventName = _eventName;
        cost = uint256(100);

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    function _baseURI() internal pure override returns (string memory) {
        return "http://www.tobedetermined.com";
    }

    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function safeMint() public onlyOwner {
        uint256 seatId = _seatIdCounter.current();
        require(seatId < maxTickets, "Max number of tickets already minted");
        _seatIdCounter.increment();
        _safeMint(address(this), seatId);
    }

  
     function batchMint(uint256 mintQuantity) public onlyOwner {
        uint256 seatId = _seatIdCounter.current();
        require(seatId + mintQuantity <= maxTickets, "Max number of tickets already minted or batch will be too large");
        require(mintQuantity > 1, "Need to mint some!");
        for(uint256 i = 0; i < mintQuantity; i++){
            _safeMint(address(this), seatId);
            seatId++;
            _seatIdCounter.increment();
        } 
    }


    function seatTaken(uint256 _seat) public view returns (bool) {
        return tickets[_seat].purchaser != address(0);
    }

    function setupTicketScannerRoles(address ticketScanner) public onlyOwner {
        grantRole(TICKET_SCANNER_ROLE, ticketScanner);
    }

    function createTicket(uint256 _ticketId, uint256 _seatNumber, uint256 _cost, uint256 _date) public onlyOwner {

        // Check that the seat number is not already in use
        require(!seatTaken(_seatNumber), "Seat already created");
        // Check that the ticketId is not greater than the maxTickets
        require(_ticketId < maxTickets, "Ticket ID is greater than maxTickets");
        // Check that the seat number is not greater than the maxTickets
        require(_seatNumber <= maxTickets, "Seat number is greater than maxTickets");
        // Check that enough minted tickets exist
        require(_ticketId < _seatIdCounter.current(), "Not enough minted tickets");

        // Create a new Ticket struct in memory
        Ticket memory newTicket = Ticket({
            seatNumber: _seatNumber,
            cost: _cost,
            date: _date,
            hasBeenScanned: false,
            isValid: true,
            purchaser: address(0)
        });

        // Store the new ticket in the tickets mapping
        tickets[_ticketId] = newTicket;

        //console.log("The Ticket is: %s", newTicket);
        


        emit TicketCreated(_ticketId, msg.sender);

    }

    function batchTicket(uint256 _ticketId, uint256 _seatNumber, uint256 _cost, uint256 _date, uint256 batchSize) public onlyOwner {
        uint256 internalTicket = _ticketId;
        for(uint256 i = 0; i < batchSize; i++){
            createTicket(_ticketId, _seatNumber, _cost, _date);
            internalTicket++;
        }
    }

    // Create a function to allow a user to Buy a ticket
    function buyTicket (uint256 _seatNumber, uint256 ticketId) public payable {
        Ticket storage selectedTicket = tickets[ticketId];

        // Check that enough minted tickets exist
        require(ticketId < _seatIdCounter.current(), "Not enough minted tickets");
        // Check that the ticket is valid
        require(selectedTicket.isValid == true, "Ticket is not valid");
        // Check that this ticket has not already been sold
        require(selectedTicket.purchaser == address(0), "Ticket already sold");
        // Ensure the requested seat matches the selected ticket
        require(selectedTicket.seatNumber == _seatNumber, "Seat number mismatch");
        // Check that the user has paid enough
        require(msg.value >= selectedTicket.cost, "Not enough funds sent");

        // Update ticket ownership record
        selectedTicket.purchaser = msg.sender;



        // Transfer the ticket to the user
        ///////////Added this///////
        _approve(msg.sender, ticketId);
        transferFrom(address(this), msg.sender, ticketId);
        ///////////Added this/////// it will transfer from the NFT from the smart contract "address(this)" to the buyer

        payable(msg.sender).transfer(msg.value - selectedTicket.cost);
        

        emit TicketBought(ticketId, msg.sender);
    }

    // Function to get the price of a ticket
    function ticketPrice(uint256 ticket) public view returns (uint256) {
        // Return the desired ticket price
        return tickets[ticket].cost;
    }

    // The following functions are overrides required by Solidity.
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function scanTicket(uint256 ticketId) public onlyRole(TICKET_SCANNER_ROLE) {
        require(tickets[ticketId].date != 0, "Ticket doesn't exist!");
        require(tickets[ticketId].isValid != false, "Ticket must be valid!");
        tickets[ticketId].hasBeenScanned = true;
        emit TicketScanned(ticketId, msg.sender);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    //function to revoke ticket
    function revokeTicket(uint256 ticketId) public onlyOwner {
        require(tickets[ticketId].date != 0, "Ticket doesn't exist!");
        tickets[ticketId].isValid = false;
        emit TicketRevoked(ticketId);
    }

    function getNumTicketsMinted() public view returns (uint256) {
        return _seatIdCounter.current();
    }

    //function withdraw()
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }

    //isValid()
    function isValid(uint256 ticketId) public view returns(bool) {
        require(tickets[ticketId].isValid != false, "Ticket doesn't exist!");
        bool _isValid = tickets[ticketId].isValid;
        return _isValid;
    }

}
