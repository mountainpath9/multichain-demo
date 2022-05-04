import { ethers } from "hardhat";
import { Signer } from "ethers";

import { expect } from "chai";

import { 
  DemoToken,
  DemoToken__factory,
  TokenStore, 
  TokenStore__factory 
} from "../typechain";

describe("Demo Token", async () => {
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;

  let token1: DemoToken;
  let token2: DemoToken;
  let store: TokenStore;


  before(async () => {
    [owner, user1, user2] = await ethers.getSigners();
    token1 = await new DemoToken__factory(owner).deploy("Demo Token 1", "DTK1");
    token2 = await new DemoToken__factory(owner).deploy("Demo Token 2", "DTK2");
    store = await new TokenStore__factory(owner).deploy();

    const user1Addr = await user1.getAddress();
    await token1.mint(user1Addr, 1000);
    await token2.mint(user1Addr, 1000);

    const user2Addr = await user2.getAddress();
    await token1.mint(user2Addr, 1000);
    await token2.mint(user2Addr, 1000);
  });
 
  beforeEach(async () => {

  })


  it("basic deposit and withdrawal", async () => {
    const user1Addr = await user1.getAddress();

    await token1.connect(user1).approve(store.address, 100);
    await store.connect(user1).deposit(token1.address, 100);
    expect( await token1.balanceOf(user1Addr) ).eq(900);

    await store.connect(user1).withdraw(token1.address, 50);
    expect( await token1.balanceOf(user1Addr) ).eq(950);

    await store.connect(user1).withdraw(token1.address, 50);
    expect( await token1.balanceOf(user1Addr) ).eq(1000);
  });


  it("can't over withdraw", async () => {
    const user1Addr = await user1.getAddress();

    await token1.connect(user1).approve(store.address, 100);
    await store.connect(user1).deposit(token1.address, 100);
    expect( await token1.balanceOf(user1Addr) ).eq(900);

    await expect(store.connect(user1).withdraw(token1.address, 150))
      .to.be.revertedWith("Insufficient balance");

    await store.connect(user1).withdraw(token1.address, 100);
    expect( await token1.balanceOf(user1Addr) ).eq(1000);
  });

  it("balances can be queried", async () => {
    const user1Addr = await user1.getAddress();


    await token1.connect(user1).approve(store.address, 100);
    await store.connect(user1).deposit(token1.address, 100);
    expect( await token1.balanceOf(user1Addr) ).eq(900);

    await token2.connect(user1).approve(store.address, 200);
    await store.connect(user1).deposit(token2.address, 200);
    expect( await token1.balanceOf(user1Addr) ).eq(900);

    const balances = await store.connect(user1).getBalances();
    expect(balances[0].erc20Token).eq(token1.address);
    expect(balances[0].balance).eq(100);
    expect(balances[1].erc20Token).eq(token2.address);
    expect(balances[1].balance).eq(200);

    await store.connect(user1).withdraw(token1.address, 100);
    await store.connect(user1).withdraw(token2.address, 200);
  });

  it("token balances are independent", async () => {
    const user1Addr = await user1.getAddress();

    await token1.connect(user1).approve(store.address, 100);
    await store.connect(user1).deposit(token1.address, 100);
    expect( await token1.balanceOf(user1Addr) ).eq(900);

    await token2.connect(user1).approve(store.address, 200);
    await store.connect(user1).deposit(token2.address, 200);
    expect( await token1.balanceOf(user1Addr) ).eq(900);

    await expect(store.connect(user1).withdraw(token1.address, 200))
    .to.be.revertedWith("Insufficient balance");

    await store.connect(user1).withdraw(token1.address, 100);
    await store.connect(user1).withdraw(token2.address, 200);
  });

  it("user balances are independent", async () => {
    const user1Addr = await user1.getAddress();
    const user2Addr = await user1.getAddress();

    await token1.connect(user1).approve(store.address, 100);
    await store.connect(user1).deposit(token1.address, 100);
    expect( await token1.balanceOf(user1Addr) ).eq(900);

    await expect(store.connect(user2).withdraw(token1.address, 100))
    .to.be.revertedWith("Insufficient balance");

    await store.connect(user1).withdraw(token1.address, 100);
  });

});