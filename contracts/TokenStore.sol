pragma solidity 0.8.13;

import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
  Demo contract that stores tokens on behalf of a user,
  and allows them to be withdrawn
 */
contract TokenStore is Ownable {

    struct Balance {
        address erc20Token;
        uint256 balance;
    }

    mapping(address => Balance[]) balancesByOwner;

    event Deposit(address indexed _from, address indexed _token, uint256 amount);
    event Withdraw(address indexed _from, address indexed _token, uint256 amount);

    function deposit(address erc20Token, uint256 amount) public {
        uint balanceIdx = getBalanceIdx(msg.sender, erc20Token);
        balancesByOwner[msg.sender][balanceIdx].balance += amount;
        IERC20 token = IERC20(erc20Token);
        token.transferFrom(msg.sender, address(this), amount); 
        emit Deposit(msg.sender, erc20Token, amount);
    }

    function withdraw(address erc20Token, uint256 amount) public {
        uint balanceIdx = getBalanceIdx(msg.sender, erc20Token);
        uint256 existingBalance = balancesByOwner[msg.sender][balanceIdx].balance;
        require(existingBalance >= amount, "Insufficient balance");
        balancesByOwner[msg.sender][balanceIdx].balance -= amount;

        IERC20 token = IERC20(erc20Token);
        token.transfer(msg.sender, amount);

        emit Withdraw(msg.sender, erc20Token, amount);        
    }

    function getBalances() public view returns (Balance[] memory) {
        return balancesByOwner[msg.sender];
    }

    function getBalanceIdx(address owner, address erc20Token) private returns (uint) {
        Balance[] memory deposits = balancesByOwner[owner];
        for(uint i = 0; i < deposits.length; i++ ) {
            if (deposits[i].erc20Token == erc20Token) {
                return i;
            }
        }
        Balance memory newBalance;
        newBalance.erc20Token = erc20Token;
        newBalance.balance = 0;
        balancesByOwner[owner].push(newBalance);
        return balancesByOwner[owner].length - 1;
    }
}