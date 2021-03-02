pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

import "./Ownable.sol";

contract MonFactory is Ownable {
  uint256 BASE_XP = 10;
  uint256 BATTLE_COOLDOWN_TIME = 1 days;
  uint256 BREED_COOLDOWN_TIME = 30 days;

  struct CryptoMon {
    string name;
    string gender;
    uint256 xp;
    uint256 battleReadyTime;
    uint256 breedReadyTime;
    uint16 pokemonId;
    uint16 evolutionLevel;
    bool battleReady;
    bool shiny;
  }

  struct Player {
    string name;
    string avatar;
    bool verified;
    bool receivedFirstCryptoMon;
  }

  CryptoMon[] public cryptoMons;

  mapping (address => Player) public players;
  mapping (uint256 => address) public monToOwner;

  function createUser
    (
      string memory _name, 
      string memory _avatar
    ) public {
    require(!players[msg.sender].verified, "You already have an account!");
    players[msg.sender] = Player(_name, _avatar, true, false);
  }

  function createFirstCryptoMon
    (
      string[] memory _names, 
      string[] memory _genders, 
      uint16[] memory _pokemonIds,
      bool[] memory _shiny,
      address _player
    ) public onlyOwner {
    require(!players[msg.sender].receivedFirstCryptoMon, "You already received your first cryptoMon!");
    _createNewCryptoMon(_names, _genders, _pokemonIds, _shiny, _player);
    players[msg.sender].receivedFirstCryptoMon = true;
  }

  function _createNewCryptoMon
    (
      string[] memory _names, 
      string[] memory _genders, 
      uint16[] memory _pokemonIds,
      bool[] memory _shiny,
      address _player
    ) internal {
    require(players[_player].verified, "You're not verified!");
    for(uint i = 0; i < _names.length; i++) {
      uint id = cryptoMons.push(CryptoMon(
        _names[i],
        _genders[i],
        BASE_XP,
        now + BATTLE_COOLDOWN_TIME,
        now + BREED_COOLDOWN_TIME,
        _pokemonIds[i],
        1,
        false,
        _shiny[i]
      )) - 1;

      monToOwner[id] = _player;
    }
  }
}