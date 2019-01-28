pragma solidity ^0.5.0;

import './Ownable.sol';
import './SafeMath.sol';

contract Bank is Ownable {
    using SafeMath for uint256;

    mapping (address => uint256) private balances;
    mapping (address => bool) private whitelist;
    mapping (address => uint256) private spentToday;
    mapping (address => uint256) private lastDay;
    uint256 public dailyLimit = 10 ether;

    event Deposit(address account, uint256 amount);
    event Payment(address from, address to, uint256 amount);

    function setDailyLimit(uint256 _newLimit) public onlyOwner {
        dailyLimit = _newLimit;
    }

    function deposit() public payable {
        address account = msg.sender;
        balances[account] = balances[account].add(msg.value);
        emit Deposit(account, msg.value);
    }

    function send(uint256 amount, address payable to) public {
        address from = msg.sender;
        require(balances[from] >= amount, "Insufficient balance");
        // can different messages for each requirement be setted?
        require(isWhitelisted(to) == true || underLimit(amount), "Non-whitelisted recipient or sender\'s daily limit reached");
        balances[from] = balances[from].sub(amount); 
        balances[to] = balances[to].add(amount); 
        to.transfer(amount);
        emit Payment(from, to, amount);
    }

    function allow(address payee) public onlyOwner {
        whitelist[payee] = true;
    }

    function isWhitelisted(address payee) public view returns (bool) {
        return whitelist[payee];
    }

    function balance() public view returns (uint256) {
        address account = msg.sender;
        return balances[account];
    }

   /**
   * Influenced by OpenZeppelin's DayLimit.sol
   * @dev Return true if limit has not been reached. A separate entry is persisted on relevant mappings.
   */
  function underLimit(uint256 _value) internal returns (bool) {
    // reset the spend limit if we're on a different day to last time.
    if (today() > lastDay[msg.sender]) {
      spentToday[msg.sender] = 0;
      lastDay[msg.sender] = today();
    }

    if (spentToday[msg.sender].add(_value) <= dailyLimit) {
      spentToday[msg.sender] == spentToday[msg.sender].add(_value);
      return true;
    }
    return false;
  }

  /**
   * @dev Determine today's index
   * @return uint256 of today's index.
   */
  function today() private view returns (uint256) {
    return now / 1 days;
  }

}