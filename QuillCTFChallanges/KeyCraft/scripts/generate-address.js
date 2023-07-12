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

// console.log('Mnemonic:', randomMnemonic.phrase);
// console.log('Addresses:', addresses);

// Value of aUint160: 1412613622543105
// Value of shiftedResult: 13057
// Addresses: [
//   {
//     address: '0x504C3bd2d330170a1AE0a48C377007b906D4B998',
//     publicKey: '0x0465e5ecb71749c4d7236dfa7ff7f1cbed66b03914ee49369f54386e95fa6823ad590e40ba17d8dd0205d80f5acb7e6cefb6199383b8ed47e7f07e14dcca96dafa',
//     privateKey: '0x7cbae7f5e8bd98d152015097b41ddfc6bbd83de6607cad817923562dbab78244'
//   }
// ]
