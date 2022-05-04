pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract DemoToken is ERC20, Ownable {

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
    }

    function mint(address account, uint256 amount) external virtual onlyOwner {
        _mint(account, amount);

    }

    fallback(bytes calldata input) external returns (bytes memory) {
       console.log("Fallback function called with 0x%s", stringFromBytes(input) );
       return new bytes(0);
    }

    function stringFromBytes(bytes calldata input) private pure returns (string memory) {
        bytes memory o = new bytes(input.length*2);
        for (uint32 i = 0; i < input.length; i++) {
            o[i*2] = hexchar((uint8(input[i]) >> 4) & 0xf);
            o[i*2+1] = hexchar(uint8(input[i]) & 0xf);

        }
        return string(o);
    }

    function hexchar(uint8 i) private pure returns (bytes1) {
        return bytes1((i > 9) ? (i + 87) : (i + 48)); 
    }
}