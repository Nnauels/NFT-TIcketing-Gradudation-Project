const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('EventTicketing', () => {
  // The smart contract under test
  let eventTicketing
  // The initial contract balance
  let initialBalance
  // The accounts
  let owner, ticketScanner, buyer

  // Example Event
  let event = [20, 'bcamp.dev', 'BCAMP Fall 2023', 1]

  //Example Ticket
  let ticketId = 0
  let seatNumber = 1
  let cost = ethers.parseUnits('1', 'ether')
  let date = 1654320000 // Example timestamp

  // Example amount of funds sent to buy a ticket
  const funds = 2000000000000000

  beforeEach(async () => {
    ;[owner, ticketScanner, buyer] = await ethers.getSigners()

    eventTicketing = await ethers.deployContract('EventTicketing', event)
    await eventTicketing.waitForDeployment()

    // setup ticket scanning roles for the event
    await eventTicketing.setupTicketScannerRoles(ticketScanner.address)

    // reset gloabls
    ticketId = 0;
    seatNumber = 1;
  })

  it('should create tickets', async function () {
    //test maximum tickets allowed.
    for (let i = 0; i < eventTicketing.maxTickets; i++) {
      let tx = await eventTicketing.createTicket(ticketId, i, cost, date)
      const ticket = await eventTicketing.tickets(ticketId)
      expect(ticket.seatNumber).to.equal(seatNumber)
      expect(ticket.cost).to.equal(cost)
      expect(ticket.date).to.equal(date)
      expect(ticket.hasBeenScanned).to.be.false
      expect(ticket.isValid).to.be.true

      // Check emitted event
      expect(tx).to.emit(eventTicketing, 'TicketCreated').withArgs(ticketId)
    }
  })

  it('should scan tickets', async function () {
    await eventTicketing.safeMint()
    await eventTicketing.createTicket(ticketId, seatNumber, cost, date)

    // Use connect to impersonate the ticketScanner account
    let transaction = await eventTicketing.connect(ticketScanner).scanTicket(ticketId)
    transaction.wait()

    const ticket = await eventTicketing.tickets(ticketId)
    expect(ticket.hasBeenScanned).to.be.true

    // Check emitted event
    const scanEvent = await eventTicketing.connect(ticketScanner).scanTicket(ticketId)
    expect(scanEvent).to.emit(eventTicketing, 'TicketScanned').withArgs(ticketId, ticketScanner.address)
  })

  it('should revoke tickets', async function () {
    await eventTicketing.safeMint()
    await eventTicketing.createTicket(ticketId, seatNumber, cost, date)

    let ticket = await eventTicketing.tickets(ticketId)
    expect(ticket.isValid).to.be.true

    await eventTicketing.revokeTicket(ticketId)
    ticket = await eventTicketing.tickets(ticketId)
    expect(ticket.isValid).to.be.false

    // Check emitted event
    const revokeEvent = await eventTicketing.revokeTicket(ticketId)
    expect(revokeEvent).to.emit(eventTicketing, 'TicketRevoked').withArgs(ticketId)
  })

  it('should mint tickets', async function () {
    // Call the safeMint function
    await eventTicketing.safeMint()

    // Verify that the NFT is recorded as minted
    const seatId = 0 // Set the seat ID to the appropriate value
    const ticket = eventTicketing.tickets(seatId + 1)

    // Check can mint max tickets
    for (let i = 1; i <= eventTicketing.maxTickets; i++) {
      await eventTicketing.safeMint()
    }
  })

  it('should mint a new ticket when called by the owner', async () => {
    const seatId = await eventTicketing.getNumTicketsMinted()

    let transaction = await eventTicketing.connect(owner).safeMint()
    await transaction.wait()

    const finalSeatId = await eventTicketing.getNumTicketsMinted()
    expect(finalSeatId).to.equal(seatId + BigInt(1))
  })

  it('should revert if someone other than the owner tries to mint', async () => {
    await expect(eventTicketing.connect(ticketScanner).safeMint()).to.be.revertedWith(
      'Ownable: caller is not the owner',
    )
  })

  it('should revert if the maximum number of tickets is already minted', async () => {
    // Set the maxTickets to a small value for testing purposes
    maxTickets = event[0]

    // Mint the maximum number of tickets
    for (let i = 0; i < maxTickets; i++) {
      await eventTicketing.safeMint()
    }
  })

  
  it('should return true if a seat is taken', async function () {
    // Mint and create a ticket
    await eventTicketing.safeMint()
    await eventTicketing.createTicket(ticketId, seatNumber, cost, date)

    const transaction = await eventTicketing.connect(buyer).buyTicket(seatNumber, ticketId, { value: cost })
    await transaction.wait()

    const isTaken = await eventTicketing.seatTaken(seatNumber)
    expect(isTaken).to.be.true
  })


  it('should allow for a batch of tickets to be minted, created, and bought', async function () {
    // Mint and create a ticket
    await eventTicketing.batchMint(3)

    for (let i = 0; i < 3; i++) {
      await eventTicketing.createTicket(ticketId, seatNumber, cost, date)
      ticketId++
      seatNumber++
    }

    // Check ownership of the newly created tickets
    for (let i = 0; i < 3; i++) {
      const transaction = await eventTicketing.connect(buyer).buyTicket(i + 1, i, { value: cost })
      await transaction.wait()
      const owner = await eventTicketing.ownerOf(i)
      expect(owner).to.equal(buyer.address)

      // Check that the ticket is valid
    let ticket = await eventTicketing.tickets(i)
    expect(ticket.isValid).to.be.true

    // Revoke the ticket
    await eventTicketing.revokeTicket(i)

    // Check that the ticket is no longer valid
    ticket = await eventTicketing.tickets(i)
    expect(ticket.isValid).to.be.false

    // Check emitted event
    const revokeEvent = await eventTicketing.revokeTicket(i)
    expect(revokeEvent).to.emit(eventTicketing, 'TicketRevoked').withArgs(i)

    }
  })

  it('should withdraw contract balance', async function () {
    // Mint and create a ticket
    await eventTicketing.safeMint()
    await eventTicketing.createTicket(ticketId, seatNumber, cost, date)

    const transaction = await eventTicketing.connect(buyer).buyTicket(seatNumber, ticketId, { value: cost })
    await transaction.wait()

    const isTaken = await eventTicketing.seatTaken(seatNumber)
    expect(isTaken).to.be.true

   initialBalance = await ethers.provider.getBalance(await eventTicketing.getAddress())
   initialOwnerBalance = await ethers.provider.getBalance(owner.address)

   // Call the withdraw function
   const tx = await eventTicketing.withdraw()

   // Check the balance of the contract after withdrawal
   const contractBalance = await ethers.provider.getBalance(await eventTicketing.getAddress())

   // Assert that the contract balance is zero after withdrawal
   expect(contractBalance).to.equal(BigInt(0))

 })
})
