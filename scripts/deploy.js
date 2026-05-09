const { ethers } = require("hardhat");

async function main() {
  console.log("is this running 1?")
  const EventTicketing = await ethers.getContractFactory("EventTicketing");

  const maxTickets = 100;  // replace with your value
  const eventLocation = "My Event Location";  // replace with your value
  const eventName = "My Event";  // replace with your value
  const eventTime = Math.floor(1703484000);  // replace with your value (in UNIX timestamp)

  const eventTicketing = await EventTicketing.deploy(maxTickets, eventLocation, eventName, eventTime);
  console.log("EventTicketing deployed to:", eventTicketing.target);

  const mintQuantity = 100;  // replace with your value
  const seatNumber = 1;  // replace with your value
  const cost = ethers.parseEther("1.00");  // replace with your value (in ethers)
  const date = Math.floor(Date.now() / 1000);  // replace with your value (in UNIX timestamp)
  const batchSize = 100;  // replace with your value

  await eventTicketing.batchMint(mintQuantity);
  console.log("Minted " + mintQuantity + " tickets");
  for(var i = 0; i < batchSize; i++){
    await eventTicketing.createTicket(i, i, cost, date)
    console.log(`Created ticket number: ${i} `);
  }
  
}

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});





