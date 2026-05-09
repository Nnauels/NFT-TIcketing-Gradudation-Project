//contract address: 0x5FbDB2315678afecb367f032d93F642f64180aa3 goerli is 0x9f125B256910F074cCe8c2854eAc4Be4686Fd3f2
//import PropTypes from 'prop-types';
import qrCode from '../assets/qrcode.png'

import React, { useState, useEffect } from 'react';

import { ethers } from 'ethers';

import EventTicketing from '../abis/EventTicketing.json'; // Import the ABI of your contract

// Config
//import config from './config.json'

const BuyPage = () => {
 
    const [tickets, setTickets] = useState([]);
    const [provider, setProvider] = useState(null);
    const [eventName, setEventName] = useState(null);
    const [eventDate, setEventDate] = useState(null);
    const [eventTime, setEventTime] = useState(null);
    const [eventLocation, setEventLocation] = useState(null);
   // const [maxTickets, setMaxTickets] = useState(null);
    const [contract, setContract] = useState(null);
    const [contractAddress, setContractAddress] = useState('');
    const [createdEvents, setCreatedEvents] = useState([]);
    const [contractError, setContractError] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('uiTheme') === 'dark');
    const [isArabic, setIsArabic] = useState(() => localStorage.getItem('uiLanguage') === 'ar');
    //const [ticketPurchase, setTicketPurchase] = useState(false);

    const AddressZero = '0x0000000000000000000000000000000000000000';
    const selectedEvent = createdEvents.find((eventItem) => eventItem.address === contractAddress);

    const convertDateTimeToString = (rawTime) => {
      const time = BigInt(rawTime);
      const pow2_128 = 2n ** 128n;
      const isPackedDateTime = time >= pow2_128;

      let dateObject;
      let hours;
      let minutes;

      if (isPackedDateTime) {
        const unixTimestampInSeconds = time / pow2_128;
        const secondsInDay = Number(time % pow2_128);

        dateObject = new Date(Number(unixTimestampInSeconds) * 1000);
        hours = Math.floor(secondsInDay / 3600);
        minutes = Math.floor((secondsInDay % 3600) / 60);
      } else {
        dateObject = new Date(Number(time) * 1000);
        hours = dateObject.getHours();
        minutes = dateObject.getMinutes();
      }

      const year = isPackedDateTime ? dateObject.getUTCFullYear() : dateObject.getFullYear();
      const month = String((isPackedDateTime ? dateObject.getUTCMonth() : dateObject.getMonth()) + 1).padStart(2, '0');
      const day = String(isPackedDateTime ? dateObject.getUTCDate() : dateObject.getDate()).padStart(2, '0');
      const hoursString = String(hours).padStart(2, '0');
      const minutesString = String(minutes).padStart(2, '0');

      return `${year}-${month}-${day} ${hoursString}:${minutesString}`;
    };

  const fetchTickets = async (activeContract) => {
    if (!activeContract) return;

    const totalTickets = await activeContract.getNumTicketsMinted();
    console.log("total minted tickets so far:", totalTickets.toString());

    setEventName(await activeContract.eventName());
    const time = await activeContract.eventTime();
    console.log(time.toString());
    const formattedDateTime = convertDateTimeToString(time);
    const [datePart, timePart] = formattedDateTime.split(" ");
    setEventTime(timePart);
    setEventDate(datePart);
    setEventLocation(await activeContract.eventLocation());

    const fetchedTickets = [];
    for (let i = 0; i < Number(totalTickets); i++) {
      const ticket = await activeContract.tickets(i);
      const isConfiguredTicket = ticket.date !== 0n;
      if (!isConfiguredTicket) continue;

      fetchedTickets.push({
        ticketId: i,
        seatNumber: ticket.seatNumber,
        cost: ticket.cost,
        date: ticket.date,
        hasBeenScanned: ticket.hasBeenScanned,
        isValid: ticket.isValid,
        purchaser: ticket.purchaser,
      });
    }

    setTickets(fetchedTickets);
  };
    
      

  
  useEffect(() => {
    if (!contract) return;
    fetchTickets(contract);
  }, [contract]);

  useEffect(() => {
    if (!contract) return undefined;

    const intervalId = setInterval(() => {
      fetchTickets(contract);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [contract]);

  useEffect(() => {
    const loadSavedEvents = () => {
      const savedEventsRaw = localStorage.getItem('createdEvents');
      const savedEvents = savedEventsRaw ? JSON.parse(savedEventsRaw) : [];
      setCreatedEvents(savedEvents);
    };

    loadSavedEvents();
    window.addEventListener('storage', loadSavedEvents);
    return () => window.removeEventListener('storage', loadSavedEvents);
  }, []);

  const loadBlockchainData = async () => {
    const normalizedAddress = contractAddress.trim();

    if (!normalizedAddress) {
      setContract(null);
      setTickets([]);
      setEventName(null);
      setEventDate(null);
      setEventTime(null);
      setEventLocation(null);
      setContractError('');
      return;
    }

    if (!ethers.isAddress(normalizedAddress)) {
      setContract(null);
      setContractError(isArabic ? 'صيغة عنوان العقد غير صحيحة.' : 'Invalid contract address format.');
      return;
    }

    if (!window.ethereum) {
      setContract(null);
      setContractError(isArabic ? 'لم يتم العثور على مزود المحفظة. يرجى تثبيت MetaMask.' : 'Wallet provider not found. Please install MetaMask.');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      console.log(provider);
      setProvider(provider);

      console.log(normalizedAddress, provider, EventTicketing.abi);
      const eventTicketing = new ethers.Contract(normalizedAddress, EventTicketing.abi, provider)
      console.log(eventTicketing)

      setContract(eventTicketing)
      setContractError('');
      await fetchTickets(eventTicketing);
    } catch (error) {
      console.error('Failed to initialize contract:', error);
      setContract(null);
      setContractError(isArabic ? 'تعذر تحميل العقد. يرجى التحقق من العنوان والشبكة.' : 'Could not load contract. Please verify address and network.');
    }



   /*  window.ethereum.on('accountsChanged', async () => {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const account = ethers.getAddress(accounts[0])
      setAccount(account)
    }) */
  }

  useEffect(() => {
    loadBlockchainData();
  }, [contractAddress]);

  useEffect(() => {
    localStorage.setItem('uiTheme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('uiLanguage', isArabic ? 'ar' : 'en');
  }, [isArabic]);

  const text = isArabic ? {
    title: 'شراء التذاكر',
    lightMode: 'الوضع الفاتح',
    darkMode: 'الوضع الداكن',
    arabic: 'العربية',
    english: 'English',
    eventTime: 'وقت الفعالية:',
    eventDate: 'تاريخ الفعالية:',
    eventLocation: 'موقع الفعالية:',
    eventPhotos: 'صور الفعالية:',
    selectEvent: 'اختر فعالية للانتقال إليها وشراء التذاكر:',
    noEvents: 'لا توجد فعاليات منشأة بعد. أنشئ فعالية أولاً.',
    purchasePrompt: 'يرجى شراء تذكرة من التذاكر المتاحة:',
    noTicketsCreated: 'لا توجد تذاكر مُهيأة بعد. قم بسكّ التذاكر وإنشائها أولاً.',
    ticket: 'تذكرة',
    seatNumber: 'رقم المقعد:',
    cost: 'السعر:',
    availableForPurchase: 'هذه التذكرة متاحة للشراء.',
    purchasedBy: 'تم شراء هذه التذكرة بواسطة العنوان:',
    buy: 'شراء',
    sold: 'تم البيع',
    refresh: 'تحديث التذاكر!',
    purchaseFailed: 'فشلت عملية شراء التذكرة. يرجى التحقق من الشبكة وبيانات العقد.'
  } : {
    title: 'Buy Tickets',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    arabic: 'العربية',
    english: 'English',
    eventTime: 'Event Time:',
    eventDate: 'Event Date:',
    eventLocation: 'Event Location:',
    eventPhotos: 'Event Photos:',
    selectEvent: 'Select an event to open and buy tickets:',
    noEvents: 'No created events found yet. Create an event first.',
    purchasePrompt: 'Please purchase a ticket from the available tickets:',
    noTicketsCreated: 'No configured tickets found yet. Mint and create tickets first.',
    ticket: 'Ticket',
    seatNumber: 'Seat Number:',
    cost: 'Cost:',
    availableForPurchase: 'This ticket is available for purchase.',
    purchasedBy: 'This ticket has been purchased by address:',
    buy: 'Buy',
    sold: 'Sold',
    refresh: 'Refresh Tickets!',
    purchaseFailed: 'Ticket purchase failed. Please verify network and contract data.'
  };
  

  const buyTicket = async (ticketId, seatNumber) => {
    if (!contract || !provider) return;

    try {
      const numMinted = await contract.getNumTicketsMinted();
      console.log("minted", numMinted.toString());
      console.log("seat requested:", seatNumber);
      console.log("ticket id requested:", ticketId);

      const signer = await provider.getSigner();
      const ticketCost = await contract.ticketPrice(ticketId);

      const transaction = await contract.connect(signer).buyTicket(seatNumber, ticketId, { value: ticketCost });
      await transaction.wait();
      await fetchTickets(contract);
    } catch (error) {
      console.error("Ticket purchase failed:", error);
      alert(error?.reason || error?.shortMessage || text.purchaseFailed);
    }
  };

  return (
    <div dir={isArabic ? 'rtl' : 'ltr'} className={`page-shell ${isDarkMode ? 'theme-dark' : 'theme-light'}`}>
      <div className="dashboard-card">
        <div className="page-topbar">
          <h1 className="header">{text.title}</h1>
          <div className='topbar-actions'>
            <button className="theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? text.lightMode : text.darkMode}
            </button>
            <button className="theme-toggle" onClick={() => setIsArabic(!isArabic)}>
              {isArabic ? text.english : text.arabic}
            </button>
          </div>
        </div>
      </div>
      <div className="form-card">
        <p className="section-title"><b>{text.selectEvent}</b></p>
        {createdEvents.length === 0 && <p>{text.noEvents}</p>}
        {createdEvents.map((eventItem) => (
          <button
            key={eventItem.address}
            className='primary-button'
            style={{ marginBottom: '10px', width: '100%', textAlign: 'left' }}
            onClick={() => setContractAddress(eventItem.address)}
          >
            {eventItem.eventName || eventItem.address} - {eventItem.eventLocation || ''}
          </button>
        ))}
      </div>
      {contractAddress !== '' && (
        <div className="form-card">
          <h2 className="section-title">{eventName}</h2>
          {selectedEvent?.images?.length > 0 && (
            <>
              <p><b>{text.eventPhotos}</b></p>
              <div className='event-gallery-grid'>
                {selectedEvent.images.map((imageSrc, index) => (
                  <img key={`${imageSrc}-${index}`} src={imageSrc} alt={`event ${index + 1}`} className='event-gallery-image' />
                ))}
              </div>
            </>
          )}
          <div className="event-details">
          <p><b>{text.eventTime}</b> {eventTime}</p>
          <p><b>{text.eventDate}</b> {eventDate}</p>    
          <p><b>{text.eventLocation}</b> {eventLocation}</p>
        </div>
        </div>
      )}
    
      <div className="form-card">
      {contractError && <p>{contractError}</p>}
      {contractAddress !== '' && (
        <div>
    <p className="section-title"><b>{text.purchasePrompt}</b></p>
    <div className="ticket-container">
   
   

{tickets.length === 0 && <p>{text.noTicketsCreated}</p>}
{tickets.map((ticket, index) => (
  <div key={ticket.ticketId} className={`ticket-tile ${ticket.purchaser !== AddressZero ? 'grayed-out' : ''}`}>
  <div className='container'>
   <div>
    <h2>{text.ticket} {index + 1}</h2><br></br>
    <p><b>{text.seatNumber}</b> {ticket.seatNumber.toString()}</p>
    <p><b>{text.cost}</b> {ethers.formatEther(ticket.cost)} ETH</p>
    {ticket.purchaser === AddressZero && ticket.isValid ? (
      <h4>{text.availableForPurchase}</h4>
    ) : !ticket.isValid ? (
      <h4>{text.sold}</h4>
    ) : (
      <h4>{text.purchasedBy}<br></br> {ticket.purchaser}</h4>
      
    )}
   
    <button className="primary-button"
      onClick={() => buyTicket(ticket.ticketId, Number(ticket.seatNumber))}
      disabled={ticket.purchaser !== AddressZero || !ticket.isValid}
    >
      {ticket.purchaser === AddressZero ? text.buy : text.sold}
    </button>
    </div>
    <div>
    <img src={qrCode} alt="QR Code" />
      </div>
      </div>
  </div>
  
))}


</div>

<button className="showTickets" onClick={async () => loadBlockchainData()}>
      {text.refresh}</button>
   
     </div> )}
    </div>
    </div>
    
  );
};

export default BuyPage;
