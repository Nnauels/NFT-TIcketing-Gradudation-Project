# NFT Ticketing Start Path

## Project paths
- Root project: `C:\Users\Administrator\Desktop\NFT-TIcketing-Grad-Project-dev\NFT-TIcketing-Grad-Project-dev`
- Frontend app: `C:\Users\Administrator\Desktop\NFT-TIcketing-Grad-Project-dev\NFT-TIcketing-Grad-Project-dev\event-ticketing`

## First-time setup
Run these once:

```powershell
cd "C:\Users\Administrator\Desktop\NFT-TIcketing-Grad-Project-dev\NFT-TIcketing-Grad-Project-dev"
npm install
cd "C:\Users\Administrator\Desktop\NFT-TIcketing-Grad-Project-dev\NFT-TIcketing-Grad-Project-dev\event-ticketing"
npm install
```

## Run all services
Use 3 terminals.

### Terminal 1 (local blockchain)
```powershell
cd "C:\Users\Administrator\Desktop\NFT-TIcketing-Grad-Project-dev\NFT-TIcketing-Grad-Project-dev"
npm run start:local
```

### Terminal 2 (deploy contract)
```powershell
cd "C:\Users\Administrator\Desktop\NFT-TIcketing-Grad-Project-dev\NFT-TIcketing-Grad-Project-dev"
npm run deploy
```

Copy the deployed contract address from terminal output.

### Terminal 3 (frontend app)
```powershell
cd "C:\Users\Administrator\Desktop\NFT-TIcketing-Grad-Project-dev\NFT-TIcketing-Grad-Project-dev\event-ticketing"
npm run start
```

## App links
- Main app: [http://localhost:3000](http://localhost:3000)
- Buy page: [http://localhost:3000/buy](http://localhost:3000/buy)

## Wallet network (MetaMask)
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
