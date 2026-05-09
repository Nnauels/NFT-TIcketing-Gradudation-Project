# BCAMP Team FLASH LOAN ARBITRAGE SMART CONTRACT SECURITY REVIEW

## Overview

* This document details the findings of a security review performed by Team NFT Ticketing on Team Flash Loan Arbitrage's project.

## Project Summary 

The Flash Loan Arbitrage Project aims to create a service that allows users to take advantage of price difference on exchanges in order to create an arbitrage opportunity.

## Vulnerability Summary

| Number of Findings | Findings | Findings Summary |
| :----------------- | :------: | :--------------: |
| 0 | **Critical** | Critical risks are those that impact the safe functioning of a platform |
|  |  | and must be addressed before launch. Users should not invest in any |
|  |  | project with outstanding criticalrisks. |
|  |  |  |
| 1 | **Major** | Major risks can include centralization issues and logicalerrors. Under |
|  |  | specific circumstances, these major riskscan lead to loss of funds |
|  |  | and/or control of the project. |
|  |  |  |
| 0 | **Medium** | Medium risks may not pose a direct risk to users’ funds, but they can |
|  |  | affect the overall functioning of a platform. |
|  |  |  |
| 3 | **Minor** | Minor risks can be any of the above, but on a smaller scale. |
|  |  | They generally do not compromise the overallintegrity of the project, |
|  |  | but they may be less efficient thanother solutions. |
|  |  |  |
| 0 | **Informational** | Informational errors are often recommendations to improve the style of |
|  |  | the code or certain operations to fallwithin industry best practices. |
|  |  | They usually do not affectthe overall functioning of the code. |

## Table of Content

* Findings
* Code Base
* Scope
* Approach and Method

## Findings

* 1.0 Underflow/overflow
* 1.1 Front Running vulnerability
* 1.2 Gas Not Used Efficiently
* 1.3 Floating Pragma
* 1.4 State Variable visibility not set

## Code Base

* [https://github.com/0xBcamp/Flash-Loan-Arbitrage-Bot\_June2023]

## Security Review Scope

* Team Flash Loan Arbitrage Smart Contract

## Approach and Method

This report has been prepared for Bcamp Flash Loan Arbitrage to discover issues and vulnerabilities in the source code of the Team Flash Loan Arbitrage project as well as any contract dependencies that were not part of an officially recognized library. A good examination has been performed, utilizing Manual Review. We used EthLint, MythX, and manual techniques to generate the follwing results.

## 1.0 UnderFlow/OverFlow Bug- Minor

### Implementation Contract: VaultImplementationV1.sol

``` solidity
 //Establish price tolerance average
        priceTolerance =
            (((priceDex1 * TOLERANCE) / 100) +
                ((priceDex2 * TOLERANCE) / 100)) /
            2;
```

### The Vulnerability

* Possible underflow/overflow bug on function checkArbitrageOpportunity() when performing arithematic operation.

### Preventative Techniques

* Use of OpenZeppelin SafeMath Library provides a standard library for performing arithematic operation on uint

## 1.1 Front Running Vulnerability - Major

### Implementation Contract: ArbitrageEngine.sol

``` solidity
  Contract - ArbitrageEngine.sol (checkArbitrageOpportunity)
  Contract - TradeExecutor.sol (executeTrade)

  Code (Approve) - 
    // Approve the dex to spend the token
    IERC20(tokenFrom).approve(dex, amount);
```

### The Vulnerability

Observation: The checkArbitrageOpportunity function of the contract is designed to identify arbitrage opportunities between two decentralized exchanges (dex1 and dex2) for a pair of tokens (token1 and token2). When a whitelisted address calls this function and it identifies an arbitrage opportunity, it emits an ArbitrageOpportunity event with the addresses of the dex to buy from, the token to buy, and the dex to sell at.

Opportunity: A malicious actor could monitor the blockchain for these ArbitrageOpportunity events. Because Ethereum transactions and event logs are public, the actor can see this event as soon as it's emitted.

In addition, the Approve() method has a known vulnerability for being front-ran, thus the methods, increaseAllowance() and decreaseAllowance() were created to mitigate this risk. Consider this in your code. Here is a discussion on stackexchange.com: https://ethereum.stackexchange.com/questions/122634/difference-between-approve-and-increaseallowance-in-erc20-contract

Action: Upon seeing an ArbitrageOpportunity event, the actor can quickly create a transaction to execute the arbitrage opportunity For example, if a whitelisted address broadcasts a transaction that calls this function, a miner could still potentially front run this transaction. The miner could do this by including their own transaction in a block before the original transaction. This is because miners have control over the order of transactions within the blocks they mine.transaction of the original caller of checkArbitrageOpportunity.

Result: The malicious actor's transaction is confirmed first, allowing them to exploit the arbitrage opportunity before the original caller can. When the original caller's transaction is finally processed, the arbitrage opportunity no longer exists, causing the transaction to fail or be less profitable.

But what about the WhiteListed requirement?
If a whitelisted address broadcasts a transaction that calls this function, a miner could still potentially front run this transaction. The miner could do this by including their own transaction in a block before the original transaction. This is because miners have control over the order of transactions within the blocks they mine.
<br>
### Preventative Techniques

* Use tx encryption or zk-SNARKs.
Transaction Encryption: This strategy involves encrypting the details of a transaction when it's submitted, so that only the miner who includes the transaction in a block can see its details. This prevents other users from seeing the transaction details in the mempool and attempting to front-run it. However, this strategy requires a mechanism for securely sharing the decryption key with the miner, which can be challenging to implement in a decentralized system like Ethereum. Additionally, it's worth noting that Ethereum currently does not natively support encrypted transactions.

* Zero-Knowledge Proofs (zk-SNARKs): Zero-knowledge proofs are a cryptographic technique where one party (the prover) can prove to another party (the verifier) that they know a value x, without conveying any information apart from the fact they know the value x. In the context of Ethereum transactions, zk-SNARKs could be used to prove that a transaction is valid and fulfills certain conditions, without revealing the details of the transaction. This could prevent front-running by keeping the transaction details hidden until it's included in a block. However, generating and verifying zk-SNARKs can be computationally intensive, and the technology is still relatively new and complex to implement.

## 1.2 Gas Not Used Efficiently - Minor

### Implementation Contract: ArbitrageEngine.sol

``` solidity
  //Get price from both dexes
  uint256 priceDex1 = IUniswapV2Router02(dex1).getAmountsOut(1, path)[1];
  uint256 priceDex2 = IUniswapV2Router02(dex2).getAmountsOut(1, path)[1];
```

### The Vulnerability

* None. But this isn't good gas management.

### Preventative Techniques

* Only call getAmountsOut once.

## 1.3 Floating Pragma - Minor

### Implementation Contract: ArbitrageEngine.sol

``` solidity
  All Files which specify, pragma solidity ^0.8.19;
```

### The Vulnerability

* Older Compiler Versions: If a strict pragma is not specified, the code could be compiled with an older version of the Solidity compiler that has known vulnerabilities. These vulnerabilities could be exploited by malicious actors, leading to potential security breaches.

Recent Compiler Versions: Conversely, the code could be compiled with a very recent compiler version that may have undiscovered vulnerabilities. As these vulnerabilities are discovered and patched in future versions, contracts compiled with the earlier version remain vulnerable.

Code Inconsistency: If different files in a project use different pragma versions, it can lead to inconsistencies in the code. This can result in unexpected behavior, which could potentially be exploited.

### Preventative Techniques

* Use a strict and locked pragma version.

## 1.4 State Variable visibility not set - Minor

### Implementation Contract: ArbitrageEngine.sol

``` solidity
  contract ArbitrageEngine is IArbitrageEngine, Whitelisted {
    uint TOLERANCE = 2; // 2%
```

### The Vulnerability

Not setting state visibility in a smart contract can be a security issue because it can lead to unintended access to contract state variables. In Solidity, the Ethereum smart contract programming language, state variables can have one of three visibility levels: public, internal, or private.

Public: Public state variables have an automatically generated getter function, meaning they can be read from outside the contract.

Internal: Internal state variables can only be accessed from within the contract itself and its derived contracts.

Private: Private state variables can only be accessed from the contract they are defined in.

If the visibility is not explicitly set, Solidity defaults to public. This means that unless the developer specifically sets a state variable to internal or private, anyone can read its value. In some cases, this might be intended behavior, but in many cases, it can lead to sensitive information being exposed. For example, if a contract holds a secret value that should only be known to the contract, making it public would allow anyone to see this value.

Furthermore, even though state variables cannot be directly modified from outside the contract, their values can still influence the contract's behavior. If these values are publicly visible, an attacker could potentially use this information to exploit the contract.

### Preventative Techniques

* Declare visiblity explicity for state variables.