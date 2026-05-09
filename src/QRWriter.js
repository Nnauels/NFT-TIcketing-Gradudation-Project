// Require the package
const QRCode = require('qrcode')
const contract = require('../artifacts/contracts/EventTicketing.sol/EventTicketing.json')
const contractABI = contract.abi;
const Web3 = require('web3').default;

const fs = require('fs');
const path = require('path');




const createQRCode = (seatNumber, cost, date, hasBeenScanned, isValid, purchaser) => {
    let data = {
        SeatNumber: seatNumber,
        Cost: cost,
        Date: date,
        ScanStatus: hasBeenScanned,
        Valid: isValid,
        Owner: purchaser
    }
    let stringData = JSON.stringify(data);
    
    QRCode.toFile(`./QRCodes/${seatNumber}.png`, stringData, {
        color: {
          dark: '#000',  // Black dots
          light: '#FFF' // Transparent background
        }
    }, function (err) {
        if (err) throw err
        console.log(`QR code image saved at: ../QRCodes/qrcode${seatNumber}.png`);
    })
}

//createQRCode(111, 222, "07/25/23", false, true, "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
//for(var i = 0; i < 3; i++){
//    createQRCode(i, "BCAMP is the Best", "I love BCAMP", "We have fun", "Ha ha ha good times", "How cool is this?"); 
//}

async function main() {
    console.log("is this running?");

    // Create a Web3 instance
    const web3 = new Web3('http://127.0.0.1:8545/');
    //const web3 = new Web3('https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID');

    // Address of the deployed contract (replace with your contract's)
    const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

    // Create a contract instance
    const contract = new web3.eth.Contract(contractABI, contractAddress);

    let totalTicketInfo = {};

    //call contract 
    const result = await contract.methods.maxTickets().call();

    const dir = './QRCodeJSONData';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    for(var i = 0; i < Number(result); i++){
        let ticketCall = await contract.methods.tickets(i).call();
        let ticket = {
            SeatNumber: Number(ticketCall.seatNumber),
            Cost: Number(ticketCall.cost),
            Date: Number(ticketCall.date),
            ScanStatus: ticketCall.hasBeenScanned,
            Valid: ticketCall.isValid,
            Owner: ticketCall.purchaser
        }
        let stringData = JSON.stringify(ticket);
        totalTicketInfo[i] = ticket;
        //creating QR Code and saving it to file
        createQRCode(ticket.SeatNumber, ticket.Cost, ticket.Date, ticket.HasBeenScanned, ticket.Valid, ticket.Purchaser);
        //Writing JSON data and writing it to file 
        fs.writeFileSync(path.join(dir, `${ticket.SeatNumber}.json`), stringData, 'utf-8', function(err) {
            if (err) throw err
            console.log(`Data saved at: ${path.join(dir, `${seatNumber}.json`)}`);
        });
    }
    
    
    console.log(totalTicketInfo);
    
}

main();
