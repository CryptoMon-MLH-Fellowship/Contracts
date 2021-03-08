const { soliditySha3 } = require("web3-utils");
const MonLiveBattle = artifacts.require("MonLiveBattle");
const utils = require("./helpers/utils");

contract("MonLiveBattle", ([owner, ash, misty, brok]) => {
	let contractInstance;

	beforeEach(async () => {
		contractInstance = await MonLiveBattle.new({ from: owner });
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

	context("sets challenge ready", async () => {
		it("allows players to set challenge ready", async () => {
			await contractInstance.setChallengeReady({ from: ash });
			const _ash = await contractInstance.players(ash);
			assert.equal(_ash.challengeReady, true);
		});

		it("does not allow players to set challenge ready twice", async () => {
			await contractInstance.setChallengeReady({ from: ash });
			await utils.shouldThrow(contractInstance.setChallengeReady({ from: ash }));
		});
	});

	context("challenge players", async () => {
		it("allows players to challenge verified and challenge ready players", async () => {
			await contractInstance.setChallengeReady({ from: ash });
			await contractInstance.setChallengeReady({ from: misty });

			const { logs } = await contractInstance.challenge(misty, 0, { from: ash });
			assert.equal(logs[0].args._challenger, ash);
			assert.equal(logs[0].args._opponent, misty);
			assert.equal(logs[0].args._monId, 0);

			const ashProfile = await contractInstance.players(ash);
			assert.equal(ashProfile.challengeReady, false);

			const challengeHash = soliditySha3(ash, misty);

			const challenge = await contractInstance.challenges(challengeHash);
			assert.equal(challenge, 1);

			const monsInBattle = await contractInstance.monsInBattle(challengeHash);
			assert.equal(monsInBattle.challengerMon, 0);
		});

		it("does not allow challenging unverified or non-challengeReady players", async () => {
			await utils.shouldThrow(contractInstance.challenge(misty, 0, { from: ash }));

			await contractInstance.setChallengeReady({ from: ash });

			await utils.shouldThrow(contractInstance.challenge(misty, 0, { from: ash }));
			await utils.shouldThrow(contractInstance.challenge(brok, 0, { from: ash }));

			await utils.shouldThrow(contractInstance.challenge(ash, 0, { from: brok }));
		});

		it("does not allow players to challenge with cryptoMons they don't own", async () => {
			await contractInstance.setChallengeReady({ from: ash });
			await contractInstance.setChallengeReady({ from: misty });

			await utils.shouldThrow(contractInstance.challenge(misty, 2, { from: ash }));
		});
	});

	context("accept challenges", async () => {
		it("allows players to accept challenges they have received", async () => {
			await contractInstance.setChallengeReady({ from: ash });
			await contractInstance.setChallengeReady({ from: misty });

			await contractInstance.challenge(misty, 0, { from: ash });

			const challengeHash = soliditySha3(ash, misty);

			const { logs } = await contractInstance.accept(ash, 2, { from: misty });
			assert.equal(logs[0].args._challengeHash, challengeHash);
			assert.equal(logs[0].args._challengerMon, 0);
			assert.equal(logs[0].args._opponentMon, 2);

			const challenge = await contractInstance.challenges(challengeHash);
			assert.equal(challenge, 2);

			const monsInBattle = await contractInstance.monsInBattle(challengeHash);
			assert.equal(monsInBattle.opponentMon, 2);
		});

		it("does not allow players to accept unreceived challenges", async () => {
			await contractInstance.setChallengeReady({ from: ash });
			await contractInstance.setChallengeReady({ from: misty });

			await utils.shouldThrow(contractInstance.accept(ash, 2, { from: misty }));
		});
	});

	context("settle battles", async () => {
		it("allows owner to settle a battle", async () => {
			await contractInstance.setChallengeReady({ from: ash });
			await contractInstance.setChallengeReady({ from: misty });

			await contractInstance.challenge(misty, 0, { from: ash });
			await contractInstance.accept(ash, 2, { from: misty });

			const challengeHash = soliditySha3(ash, misty);
			const randomNumber = Math.floor(Math.random() * 99 + 1);

			const { logs } = await contractInstance.settleChallenge(challengeHash, randomNumber, { from: owner });
			assert.oneOf(logs[0].args._winnerMon.toNumber(), [0, 2]);
			assert.equal(logs[0].args._challengeHash, challengeHash);
		});

		it("does not allow non-owners to settle battles", async () => {
			const challengeHash = soliditySha3(ash, misty);
			const randomNumber = Math.floor(Math.random() * 99 + 1);

			await utils.shouldThrow(contractInstance.settleChallenge(challengeHash, randomNumber, { from: ash }));
		});
	});
});
