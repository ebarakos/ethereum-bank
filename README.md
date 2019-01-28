

# Ethereum Bank

Sample Ethereum Bank Contract. A user can deposit ETH into the contract. Withdrawals from contract balances, have configurable daily limit set by the contract owner. Addresses can be whitelisted by the owner, so full withdrawal of funds can be made to them. 

Use case: Someone's private key is compromised. The original user can cooperate with the owner account to whitelist a certain address, allowing full withdrawal, while the attacker could steal only the daily limit and the owner couldn't withdraw anything at all.

## Installation

```npm -g install truffle```

```truffle migrate```

Check
`https://truffleframework.com/docs/truffle/overview` 
for further details.

In order to run the tests:

```npm install```

```truffle test```
