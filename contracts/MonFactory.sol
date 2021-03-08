pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

import "./Ownable.sol";

contract MonFactory is Ownable {
  uint256 BASE_XP = 10;
  uint256 BATTLE_COOLDOWN_TIME = 1 days;
  uint256 BREED_COOLDOWN_TIME = 30 days;
  uint256 MAX_SHINY = 100;

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
    bool challengeReady;
    uint256 monCount;
  }

  //Contains the list of all exisiting cryptoMons
  //The index of the cryptoMon is its unique ID
  CryptoMon[] public cryptoMons;

  //Mapping to map addresses to player details
  mapping (address => Player) public players;
  //Mapping to store the owner of mons. Key is the unique ID of the mon and value is the
  //address of the owner
  mapping (uint256 => address) public monToOwner;
  mapping(uint16 => uint256) public shinyCount;

  event NewPlayer(address _player);
  event NewCryptoMon(address _player, uint16[] _pokemonIds, bool[] _shiny);

  /**
   * Creates a new User
   */
  function createUser
    (
      string memory _name, 
      string memory _avatar
    ) public {
    require(!players[msg.sender].verified, "You already have an account!");
    players[msg.sender] = Player(_name, _avatar, true, false, false, 0);

    emit NewPlayer(msg.sender);
  }

  /**
   * Creates first cryptoMons for Users who haven't received their first cryptoMons yet
   */
  function createFirstCryptoMon
    (
      string[] memory _names, 
      string[] memory _genders, 
      uint16[] memory _pokemonIds,
      uint8 _randomNumber,
      address _player
    ) public onlyOwner {
    require(!players[_player].receivedFirstCryptoMon, "You already received your first cryptoMon!");

    bool[] memory shiny = new bool[](_pokemonIds.length);

    if(_randomNumber == 5) {
      for(uint i = 0; i < _pokemonIds.length; i++) {
        if(shinyCount[_pokemonIds[i]] < MAX_SHINY) {
          shiny[i] = true;
          shinyCount[_pokemonIds[i]]++;
          break;
        }
      }
    }

    _createNewCryptoMon(_names, _genders, _pokemonIds, shiny, _player);
    players[_player].receivedFirstCryptoMon = true;
  }

  /**
   * Generates new cryptoMons for a player
   */
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
        now,
        now,
        _pokemonIds[i],
        1,
        false,
        _shiny[i]
      )) - 1;

      monToOwner[id] = _player;
    }

    players[_player].monCount += _names.length;

    emit NewCryptoMon(_player, _pokemonIds, _shiny);
  }

  function getCryptoMonsByOwner(address _owner) public view returns (CryptoMon[] memory) {
    CryptoMon[] memory ownedCryptoMons = new CryptoMon[](players[_owner].monCount);
    uint index = 0;
    for(uint i = 0; i < cryptoMons.length; i++) {
      if(monToOwner[i] == _owner) {
        ownedCryptoMons[index] = cryptoMons[i];
        index++;
      }
    }

    return ownedCryptoMons;
  }
}