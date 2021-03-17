# CryptoMon - Smart Contracts

## Description

- This repository contains the smart contracts of the CryptoMon Game.
- MonFactory :
  - This contract is the storage area for all the CryptoMons and Players and contains the logic to create accounts for new players, create starter CryptoMons for new players.
- MonLiveBattle :
  - This contract has all the logic related to live battles.
  - Battles take place asynchronously with the help of an event-driven architecture.

## Development Setup

- Clone the repository and run `npm i` to install the dependencies.
- Install truffle globally by running `npm i -g truffle`.
- Download and Install `Ganache` on your system in order to be able to run a local blockchain for testing.
- Start your Ganache environment.
- Run `truffle test` to verify all the contracts are working fine.
- Add tests and make changes to the contract to add any features.
