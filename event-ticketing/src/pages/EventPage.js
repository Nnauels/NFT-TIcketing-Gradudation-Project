import PropTypes from 'prop-types'
import React, { useState, useEffect } from 'react'
//import QRWriter from '../../../src/qrwriter.js' doesn't like the location.

import { ethers } from 'ethers';

const EventPage = props => {

    const [eventCreated, setEventCreated] = useState(false)
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('uiTheme') === 'dark')
    const [isArabic, setIsArabic] = useState(() => localStorage.getItem('uiLanguage') === 'ar')

  // For Minting Tickets
  const [numTicketsToMint, setNumTicketsToMint] = useState(props.maxTickets)
  const [ticketsMinted, setTicketsMinted] = useState(0)
  const [ticketsCreated, setTicketsCreated] = useState(0)
  const [qrCodesCreated, setQRCodesCreated] = useState(0)

  // For Creating Tickets
  const [showModal, setShowModal] = useState(false)
  const [ticketId, setTicketId] = useState('')
  const [seatNumber, setSeatNumber] = useState('')
  const [eventImages, setEventImages] = useState([])
  // Store ticket price as user-entered ETH text, convert to wei on submit.
  const [cost, setCost] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const maxTicketsNumber = Number(props.maxTickets) || 0
  const ticketsMintedNumber = Number(ticketsMinted) || 0
  const ticketsCreatedNumber = Number(ticketsCreated) || 0
  const qrCodesCreatedNumber = Number(qrCodesCreated) || 0

  const refreshMintedCount = async () => {
    if (!props.contract) return
    try {
      const num = await props.contract.getNumTicketsMinted()
      setTicketsMinted(Number(num))
    } catch (error) {
      // Contract may still be propagating on chain right after deployment.
      console.error('Unable to read minted count yet:', error)
    }
  }

  const mintTickets = async (_numTickets) => {
    const requestedToMint = Number(_numTickets) || 0
    const ticketsLeft = Math.max(maxTicketsNumber - ticketsMintedNumber, 0)
    const safeMintCount = Math.min(requestedToMint, ticketsLeft)

    for (let i = 0; i < safeMintCount; i++) {
      const tx = await props.contract.safeMint()
      await tx.wait()
    }

    await refreshMintedCount()
  }

  const createTickets = async e => {
    e.preventDefault() // prevent the default form submission

    try {
      const dateAndTime = BigInt(props.eventDateTime);
      const costInWei = ethers.parseEther(cost.trim() || '0');
      console.log(dateAndTime);

      await props.contract.createTicket(ticketId, seatNumber, costInWei, dateAndTime)
      setTicketsCreated(prev => prev + 1)

      console.log("created a ticket");

      // clear the inputs and close the modal after successful creation
      setTicketId('')
      setSeatNumber('')
      setCost('')
      setShowModal(false)
      setErrorMsg('')
      
    } catch (error) {
      // handle error and display a message
      setErrorMsg(error.message)
    }
  }

  const showCreateModal = async () => {
    console.log('showing modal')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
  }

  const uploadEventImages = async e => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0) {
      setEventImages([])
      return
    }

    const imageDataUrls = await Promise.all(
      selectedFiles.map(
        file =>
          new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.onerror = () => reject(new Error('Failed to read image file.'))
            reader.readAsDataURL(file)
          })
      )
    )

    setEventImages(imageDataUrls)
  }

  const simulateQRCodes = async () => {
    setQRCodesCreated(ticketsCreatedNumber)
  }

  useEffect(() => {
    const fetchTicketsMinted = async () => {
      if (eventCreated && props.contract){
        await refreshMintedCount()
      }
    }

    fetchTicketsMinted()
  }, [props.contract, eventCreated])

  useEffect(() => {
    localStorage.setItem('uiTheme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  useEffect(() => {
    localStorage.setItem('uiLanguage', isArabic ? 'ar' : 'en')
  }, [isArabic])

  const text = isArabic ? {
    dashboardTitle: 'لوحة إنشاء الفعالية',
    lightMode: 'الوضع الفاتح',
    darkMode: 'الوضع الداكن',
    arabic: 'العربية',
    english: 'English',
    step1: 'الخطوة 1: أدخل تفاصيل الفعالية',
    maxTickets: 'الحد الأقصى للتذاكر',
    eventLocation: 'موقع الفعالية',
    eventName: 'اسم الفعالية',
    eventDateTime: 'تاريخ ووقت الفعالية',
    eventImages: 'صور الفعالية',
    uploadImagesHint: 'يمكنك رفع عدة صور للفعالية.',
    createEvent: 'إنشاء الفعالية',
    contractDeployedTo: 'تم نشر العقد في:',
    step2: 'الخطوة 2: سكّ التذاكر',
    mintTickets: 'سكّ التذاكر',
    defaultPreset: 'العدد الافتراضي مضبوط على الحد الأقصى للتذاكر...',
    maxMinted: 'تم سكّ الحد الأقصى من التذاكر',
    mintedCount: 'عدد التذاكر المسكوكة:',
    of: 'من',
    available: 'متاحة.',
    leftToMint: 'التذاكر المتبقية للسكّ:',
    step3: 'الخطوة 3: إنشاء التذاكر',
    createTickets: 'إنشاء تذكرة/تذاكر',
    canCreateUpToMinted: 'يمكنك إنشاء تذاكر حتى الحد الذي تم سكّه...',
    pleaseMintMore: 'يرجى سكّ المزيد من التذاكر',
    createdCount: 'عدد التذاكر المنشأة:',
    minted: 'مسكوكة.',
    leftToCreate: 'التذاكر المتبقية للإنشاء:',
    step4: 'الخطوة 4: إنشاء رموز QR',
    generateQr: 'إنشاء رمز/رموز QR',
    generatesOneQr: 'ينشئ رمز QR واحد لكل تذكرة',
    pleaseCreateMore: 'يرجى إنشاء المزيد من التذاكر',
    qrCreated: 'عدد رموز QR التي تم إنشاؤها:',
    ticketId: 'رقم التذكرة',
    seatNumber: 'رقم المقعد',
    costEth: 'السعر (ETH)',
    submit: 'إرسال'
  } : {
    dashboardTitle: 'Event Creation Dashboard',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    arabic: 'العربية',
    english: 'English',
    step1: 'Step 1: Enter your event details',
    maxTickets: 'Max Tickets',
    eventLocation: 'Event Location',
    eventName: 'Event Name',
    eventDateTime: 'Event Date & Time',
    eventImages: 'Event Images',
    uploadImagesHint: 'You can upload multiple event photos.',
    createEvent: 'Create Event',
    contractDeployedTo: 'Contract deployed to:',
    step2: 'Step 2: Mint Your Tickets',
    mintTickets: 'Mint Tickets',
    defaultPreset: 'Default is preset to Max Tickets...',
    maxMinted: 'Max Tickets Minted',
    mintedCount: 'Number of tickets minted:',
    of: 'of',
    available: 'available.',
    leftToMint: 'Tickets left to mint:',
    step3: 'Step 3: Create Your Tickets',
    createTickets: 'Create Ticket(s)',
    canCreateUpToMinted: 'You can create tickets up to the Max Minted So Far...',
    pleaseMintMore: 'Please Mint More Tickets',
    createdCount: 'Number of tickets created:',
    minted: 'minted.',
    leftToCreate: 'Tickets left to create:',
    step4: 'Step 4: Generate QR Codes',
    generateQr: 'Generate QR(s)',
    generatesOneQr: 'Generates 1 QR per Ticket',
    pleaseCreateMore: 'Please Create more Tickets',
    qrCreated: 'Number of QR Codes created:',
    ticketId: 'Ticket ID',
    seatNumber: 'Seat Number',
    costEth: 'Cost (ETH)',
    submit: 'Submit'
  }

  return (
    <div dir={isArabic ? 'rtl' : 'ltr'} className={`page-shell ${isDarkMode ? 'theme-dark' : 'theme-light'}`}>
      <div className='dashboard-card'>
        <div className='page-topbar'>
          <h1 className='header'>{text.dashboardTitle}</h1>
          <div className='topbar-actions'>
            <button className='theme-toggle' onClick={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? text.lightMode : text.darkMode}
            </button>
            <button className='theme-toggle' onClick={() => setIsArabic(!isArabic)}>
              {isArabic ? text.english : text.arabic}
            </button>
          </div>
        </div>
        <h2 className='section-title'>{text.step1}</h2>
      </div>
      <div className='form-card'>
        <input className='text-input' value={props.maxTickets} onChange={e => props.setMaxTickets(e.target.value)} placeholder={text.maxTickets} />
        <input
          className='text-input'
          value={props.eventLocation}
          onChange={e => props.setEventLocation(e.target.value)}
          placeholder={text.eventLocation}
        />
        <input className='text-input' value={props.eventName} onChange={e => props.setEventName(e.target.value)} placeholder={text.eventName} />
        <input
          className='text-input'
          type='datetime-local'
          value={props.eventDateTimeInput}
          onChange={(e) => props.setEventDateTimeInput(e.target.value)}
          aria-label={text.eventDateTime}
          title={text.eventDateTime}
          required
        />
        <label>{text.eventImages}</label>
        <input
          className='text-input'
          type='file'
          accept='image/*'
          multiple
          onChange={uploadEventImages}
        />
        <label className='note'>{text.uploadImagesHint}</label>
        {eventImages.length > 0 && (
          <div className='event-image-preview-grid'>
            {eventImages.map((imageSrc, index) => (
              <img key={`${imageSrc}-${index}`} src={imageSrc} alt={`event preview ${index + 1}`} className='event-image-preview' />
            ))}
          </div>
        )}
        <button
          className='primary-button'
          onClick={async () => {
            await props.deployContract(eventImages)
            setEventCreated(true)
          }}
        >
          {text.createEvent}
        </button>
        {props.contractAddress !== '' && (
          <>
            <label className='contract-label'>
              <b>{text.contractDeployedTo} </b>
              {props.contractAddress}
            </label>
            <hr></hr>
            <h2 className='section-title'>{text.step2}</h2>
            
            <div className='container'>
              <div className='button-container'>
                <button className='primary-button' disabled={ticketsMintedNumber >= maxTicketsNumber} onClick={() => mintTickets(numTicketsToMint)}>
                  {text.mintTickets}
                </button>
                <input
                  disabled={ticketsMintedNumber >= maxTicketsNumber}
                  className='mint-input'
                  value={numTicketsToMint}
                  onChange={e => setNumTicketsToMint(e.target.value)}
                  placeholder={props.maxTickets}
                />
                {ticketsMintedNumber < maxTicketsNumber && <label className='note'> {text.defaultPreset}</label>}
                {ticketsMintedNumber >= maxTicketsNumber && <label className='note'> {text.maxMinted}</label>}
              </div>
              <p>
                <b>{text.mintedCount}</b> {ticketsMintedNumber} <b>{text.of}</b> {maxTicketsNumber} {text.available}
              </p>
              <p>
                <b>{text.leftToMint}</b> {Math.max(maxTicketsNumber - ticketsMintedNumber, 0)}
              </p>
            </div>
            <hr></hr>
              <h2 className='section-title'>{text.step3}</h2>
            
            <div className='container'>
              <div className='button-container'>
            
                <button className='primary-button' disabled={ticketsCreatedNumber >= ticketsMintedNumber} onClick={() => showCreateModal()}>{text.createTickets}</button>
                 
                {ticketsCreatedNumber < ticketsMintedNumber && <label className='note'> {text.canCreateUpToMinted}</label>}
                {ticketsCreatedNumber >= ticketsMintedNumber && <label className='note'> {text.pleaseMintMore}</label>}
              </div>
              <p>
                <b>{text.createdCount}</b> {ticketsCreatedNumber} <b>{text.of}</b> {ticketsMintedNumber} {text.minted}
              </p>
              <p>
                <b>{text.leftToCreate}</b> {Math.max(ticketsMintedNumber - ticketsCreatedNumber, 0)}
              </p>
            </div>

            <hr></hr>
              <h2 className='section-title'>{text.step4}</h2>
              <div className='container'>
              <div className='button-container'>
            
                <button className='primary-button' disabled={ticketsCreatedNumber === 0 || qrCodesCreatedNumber === ticketsCreatedNumber} onClick={() => simulateQRCodes()}>{text.generateQr}</button>
                 
                {ticketsCreatedNumber > 0 && qrCodesCreatedNumber !== ticketsCreatedNumber && <label className='note'> {text.generatesOneQr}</label>}
                {ticketsCreatedNumber === 0 || qrCodesCreatedNumber === ticketsCreatedNumber && <label className='note'> {text.pleaseCreateMore}</label>}

              </div>
              <p>
                <b>{text.qrCreated}</b> {qrCodesCreatedNumber}
              </p>
              
            </div>
            

            {showModal && (
              <div className='modal'>
                <form onSubmit={createTickets}>
                  <input
                    className='text-input'
                    value={ticketId}
                    onChange={e => setTicketId(e.target.value)}
                    placeholder={text.ticketId}
                    required
                  />
                  <input
                    className='text-input'
                    value={seatNumber}
                    onChange={e => setSeatNumber(e.target.value)}
                    placeholder={text.seatNumber}
                    required
                  />
                  <input className='text-input' value={cost} onChange={e => setCost(e.target.value)} placeholder={text.costEth} required />
                  
                  <input className='primary-button' type='submit' value={text.submit} />
                </form>
                <div className='close-icon' onClick={closeModal}>
                  ⓧ
                </div>
                {errorMsg && <div className='error-message'>{errorMsg}</div>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

EventPage.propTypes = {
  maxTickets: PropTypes.string.isRequired,
  setMaxTickets: PropTypes.func.isRequired,
  eventLocation: PropTypes.string.isRequired,
  setEventLocation: PropTypes.func.isRequired,
  eventName: PropTypes.string.isRequired,
  setEventName: PropTypes.func.isRequired,
  eventDateTimeInput: PropTypes.string.isRequired,
  setEventDateTimeInput: PropTypes.func.isRequired,
  eventDateTime: PropTypes.any.isRequired,
  setEventDateTime: PropTypes.func.isRequired,
  contract: PropTypes.object.isRequired,
  deployContract: PropTypes.func.isRequired,
  contractAddress: PropTypes.string.isRequired,
  setContractAddress: PropTypes.func.isRequired,
}

export default EventPage
