import React from 'react';
import { ethers } from 'ethers';
//import { ethers } from 'hardhat';
import { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import BuyPage from './pages/BuyPage';
import EventPage from './pages/EventPage';

// ABIs
import eventTicketingArtifact from './abis/EventTicketing.json';  

// Styling
import './App.css';

const App = () => {
  const [maxTickets, setMaxTickets] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDateTimeInput, setEventDateTimeInput] = useState("");
  const [eventDateTime, setEventDateTime] = useState(0n);
  const [contract, setContract] = useState(null);
  const [contractAddress, setContractAddress] = useState("");
  const provider = new ethers.BrowserProvider(window.ethereum);

  //const cost = ethers.parseUnits('1', 'ether')

  const convertDateTime = () => {
    if (!eventDateTimeInput) {
      throw new Error('Event date and event time are required.');
    }

    const [datePart, timePart] = eventDateTimeInput.split('T');
    if (!datePart || !timePart) {
      throw new Error('Invalid date/time format. Please use the picker.');
    }

    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);

    if (
      Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day) ||
      Number.isNaN(hours) || Number.isNaN(minutes)
    ) {
      throw new Error('Invalid date/time format. Use YYYY-MM-DD and HH:mm.');
    }

    // Build the timestamp at UTC midnight for the selected date, then store
    // the selected time-of-day separately in the lower 128 bits.
    const unixTimestampInSeconds = BigInt(Math.floor(Date.UTC(year, month - 1, day, 0, 0, 0) / 1000));
    const timeInUint256 = BigInt((hours * 3600) + (minutes * 60));
    const packedDateTime = (unixTimestampInSeconds << 128n) + timeInUint256;

    setEventDateTime(packedDateTime);
    return packedDateTime;
  };

  const deployContract = async (eventImages = []) => {
    console.log("calling deployContract")
    const signer = await provider.getSigner();
    const EventTicketingABI = eventTicketingArtifact.abi;
    const EventTicketingBytecode = eventTicketingArtifact.bytecode;
    const EventTicketingFactory = new ethers.ContractFactory(EventTicketingABI, EventTicketingBytecode, signer);
    
    const packedEventDateTime = convertDateTime();
    console.log("eventDateTime: " + packedEventDateTime)
 
    const eventTicketing = await EventTicketingFactory.deploy(
      maxTickets, 
      eventLocation, 
      eventName, 
      packedEventDateTime
    );

    // Ensure the contract is mined before any read calls.
    await eventTicketing.waitForDeployment();

    setContract(eventTicketing);
    setContractAddress(eventTicketing.target);
    console.log("EventTicketing deployed to:", eventTicketing.target);

    const deployedEvent = {
      address: eventTicketing.target,
      eventName,
      eventLocation,
      eventDateTime: packedEventDateTime.toString(),
      images: Array.isArray(eventImages) ? eventImages : [],
    };

    const existingEventsRaw = localStorage.getItem('createdEvents');
    const existingEvents = existingEventsRaw ? JSON.parse(existingEventsRaw) : [];
    const alreadySaved = existingEvents.some((eventItem) => eventItem.address === deployedEvent.address);
    const updatedEvents = alreadySaved ? existingEvents : [deployedEvent, ...existingEvents];
    localStorage.setItem('createdEvents', JSON.stringify(updatedEvents));

  };

 
  

  return (
    
    <Router>
   
      <Routes>
      <Route path="/" element={ <EventPage 
                                  maxTickets={maxTickets}
                                  setMaxTickets={setMaxTickets}
                                  eventLocation={eventLocation}
                                  setEventLocation={setEventLocation}
                                  eventName={eventName}
                                  setEventName={setEventName}
                                  eventDateTimeInput={eventDateTimeInput}
                                  setEventDateTimeInput={setEventDateTimeInput}
                                  eventDateTime={eventDateTime}
                                  setEventDateTime={setEventDateTime}
                                  contract={contract}
                                  setContract={setContract}
                                  contractAddress={contractAddress}
                                  setContractAddress={setContractAddress}
                                  deployContract={deployContract}
                                /> } />
          <Route path="/buy" element={ <BuyPage 
                                     

                                              />} />
        </Routes>
    </Router>
  );
  
}

export default App;
