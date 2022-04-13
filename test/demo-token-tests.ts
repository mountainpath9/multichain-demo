import { ethers } from "hardhat";
import { Signer } from "ethers";

import { expect } from "chai";

import { 
  DemoToken, 
  DemoToken__factory 
} from "../typechain";

describe("Demo Token", async () => {
  let token: DemoToken;
  let owner: Signer;
 
  beforeEach(async () => {
    [owner] = await ethers.getSigners();
    token = await new DemoToken__factory(owner).deploy()
  })

  it("Initial minting", async () => {
    const ownerAddr = await owner.getAddress();
    await token.mint(ownerAddr, 1000);
    expect( await token.balanceOf(ownerAddr) ).eq(1000);
  });

  it("Basic transfer", async () => {
    const ownerAddr = await owner.getAddress();
    await token.mint(ownerAddr, 1000);


    const [_, target] = await ethers.getSigners();

    const targetAddr = await target.getAddress(); 
    await token.transfer(targetAddr, 250);

    expect( await token.balanceOf(ownerAddr) ).eq(750);
    expect( await token.balanceOf(targetAddr) ).eq(250);
  });

});