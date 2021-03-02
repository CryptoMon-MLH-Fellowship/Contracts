var MonFactory = artifacts.require('MonFactory');
const utils = require('./helpers/utils');

contract('MonFactory', ([owner, ash, misty, brok]) => {
	let contractInstance;

	beforeEach(async () => {
		contractInstance = await MonFactory.new({ from: owner });
	});

	it('assigns owner of the contract', async () => {
		const _owner = await contractInstance.owner();
		assert.equal(owner, _owner);
	});

	it('creates new account for unregistered user', async () => {
		await contractInstance.createUser('ash', 'https://avatar.com', { from: ash });
		const _ash = await contractInstance.players(ash);
		assert.equal(_ash.name, 'ash');
		assert.equal(_ash.avatar, 'https://avatar.com');
		assert.equal(_ash.verified, true);
	});

	it('does not create new account for registered user', async () => {
		await contractInstance.createUser('ash', 'https://avatar.com', { from: ash });
		await utils.shouldThrow(contractInstance.createUser('ash', 'https://avatar.com', { from: ash }));
	});

	it('should create first cryptomon for registered user', async () => {
		await contractInstance.createUser('ash', 'https://avatar.com', { from: ash });
		await contractInstance.createFirstCryptoMon(
			['pikachu', 'pidgey'],
			['male', 'male'],
			[1, 2],
			[false, true],
			ash,
			{ from: owner }
		);

		const cryptoMons = await Promise.all([contractInstance.cryptoMons(0), contractInstance.cryptoMons(1)]);

		assert.equal(cryptoMons[0].name, 'pikachu');
		assert.equal(cryptoMons[0].gender, 'male');
		assert.equal(cryptoMons[0].xp.toNumber(), 10);
		assert.equal(cryptoMons[0].pokemonId, 1);
		assert.equal(cryptoMons[0].evolutionLevel, 1);
		assert.equal(cryptoMons[0].battleReady, false);
		assert.equal(cryptoMons[0].shiny, false);

		assert.equal(cryptoMons[1].name, 'pidgey');
		assert.equal(cryptoMons[1].gender, 'male');
		assert.equal(cryptoMons[1].xp.toNumber(), 10);
		assert.equal(cryptoMons[1].pokemonId, 2);
		assert.equal(cryptoMons[1].evolutionLevel, 1);
		assert.equal(cryptoMons[1].battleReady, false);
		assert.equal(cryptoMons[1].shiny, true);

		const owners = await Promise.all([contractInstance.monToOwner(0), contractInstance.monToOwner(1)]);
		owners.forEach((_owner) => assert.equal(_owner, ash));
	});

	it('should not create first cryptomons for users who already received them', async () => {
		await contractInstance.createUser('ash', 'https://avatar.com', { from: ash });
		await contractInstance.createFirstCryptoMon(
			['pikachu', 'pidgey'],
			['male', 'male'],
			[1, 2],
			[false, true],
			ash,
			{ from: owner }
		);

		await utils.shouldThrow(
			contractInstance.createFirstCryptoMon(['pikachu', 'pidgey'], ['male', 'male'], [1, 2], [false, true], ash, {
				from: owner,
			})
		);
	});

	it('should not create first cryptomon for unregistered users', async () => {
		await utils.shouldThrow(
			contractInstance.createFirstCryptoMon(
				['pikachu', 'pidgey'],
				['male', 'male'],
				[1, 2],
				[false, true],
				misty,
				{
					from: owner,
				}
			)
		);
	});
});
