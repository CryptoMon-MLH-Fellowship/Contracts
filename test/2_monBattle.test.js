const { soliditySha3 } = require("web3-utils");
const MonBattle = artifacts.require("MonBattle");
const utils = require("./helpers/utils");

contract("MonBattle", ([owner, ash, misty, brok]) => {
	let contractInstance;

	beforeEach(async () => {
		contractInstance = await MonBattle.new({ from: owner });
		await contractInstance.createUser("ash", "https://avatar.com", { from: ash });
		await contractInstance.createUser("misty", "https://avatar.com", { from: misty });

		/**
		 * Pokemon:-
		 * 0 = Pikachu (Ash)
		 * 1 = Pidgey (Ash)
		 * 2 = Bulbasaur (Misty)
		 * 3 = Squirtle (Misty)
		 */

		await contractInstance.createFirstCryptoMon(["pikachu", "pidgey"], ["male", "male"], [1, 2], 5, ash, {
			from: owner,
		});
		await contractInstance.createFirstCryptoMon(["bulbasaur", "squirtle"], ["male", "female"], [3, 4], 6, misty, {
			from: owner,
		});
	});

	context("sets a pokemon up for battle", async () => {
		it("allows owners to set their pokemon up for battle", async () => {
			await contractInstance.setBattleReady(0, { from: ash });
			const pikachu = await contractInstance.cryptoMons(0);
			assert.equal(pikachu.battleReady, true);
		});

		it("does not allow non-owners to set pokemon up for battle", async () => {
			await utils.shouldThrow(contractInstance.setBattleReady(0, { from: misty }));
		});
	});

	context("allows users to start a battle against other mons", async () => {
		it("allows players to battle other mons", async () => {
			await Promise.all([
				contractInstance.setBattleReady(0, { from: ash }),
				contractInstance.setBattleReady(2, { from: misty }),
			]);
			const { logs } = await contractInstance.startBattle(2, 0, { from: misty });
			assert.equal(logs[0].args._mon1.toNumber(), 2);
			assert.equal(logs[0].args._mon2.toNumber(), 0);
		});

		it("does not allow players to set battleReady immediately after a battle", async () => {
			await Promise.all([
				contractInstance.setBattleReady(0, { from: ash }),
				contractInstance.setBattleReady(2, { from: misty }),
			]);
			await contractInstance.startBattle(2, 0, { from: misty });

			await utils.shouldThrow(contractInstance.setBattleReady(0, { from: ash }));
			await utils.shouldThrow(contractInstance.setBattleReady(2, { from: misty }));
		});

		it("does not allow owners to battle their own mon", async () => {
			await Promise.all([
				contractInstance.setBattleReady(0, { from: ash }),
				contractInstance.setBattleReady(1, { from: ash }),
			]);
			await utils.shouldThrow(contractInstance.startBattle(0, 1, { from: ash }));
		});

		it("does not allow non-owners to battle with other mons", async () => {
			await utils.shouldThrow(contractInstance.startBattle(0, 2, { from: misty }));
		});

		it("does not allow battle if owner mon not battle ready", async () => {
			await contractInstance.setBattleReady(0, { from: ash });
			await utils.shouldThrow(contractInstance.startBattle(2, 0, { from: misty }));
		});

		it("does not allow battle if opposite mon not battle ready", async () => {
			await contractInstance.setBattleReady(2, { from: misty });
			await utils.shouldThrow(contractInstance.startBattle(2, 0, { from: misty }));
		});

		it("does not allow battle if mons not battle ready", async () => {
			await utils.shouldThrow(contractInstance.startBattle(2, 0, { from: misty }));
		});
	});

	context("settles battles", async () => {
		it("allows owner to settle a battle", async () => {
			await Promise.all([
				contractInstance.setBattleReady(0, { from: ash }),
				contractInstance.setBattleReady(2, { from: misty }),
			]);
			await contractInstance.startBattle(2, 0, { from: misty });

			const randomNumber = Math.floor(Math.random() * 99 + 1);
			const { logs } = await contractInstance.settleBattle(2, 0, randomNumber, { from: owner });
			assert.oneOf(logs[0].args._winnerMon.toNumber(), [2, 0]);
		});

		it("does not allow non owners to settle a battle", async () => {
			await Promise.all([
				contractInstance.setBattleReady(0, { from: ash }),
				contractInstance.setBattleReady(2, { from: misty }),
			]);
			await contractInstance.startBattle(2, 0, { from: misty });

			const randomNumber = Math.floor(Math.random() * 99 + 1);
			await utils.shouldThrow(contractInstance.settleBattle(2, 0, randomNumber, { from: ash }));
		});

		it("does not allow owner to settle non-existing battles", async () => {
			await Promise.all([
				contractInstance.setBattleReady(0, { from: ash }),
				contractInstance.setBattleReady(2, { from: misty }),
			]);
			await contractInstance.startBattle(2, 0, { from: misty });

			const randomNumber = Math.floor(Math.random() * 99 + 1);
			await utils.shouldThrow(contractInstance.settleBattle(0, 2, randomNumber, { from: owner }));
		});
	});
});
