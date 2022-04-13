pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DemoToken is ERC20, Ownable {

    constructor() ERC20("DemoToken", "DTK") {
    }

    function mint(address account, uint256 amount) external virtual onlyOwner {
        _mint(account, amount);
    }
}