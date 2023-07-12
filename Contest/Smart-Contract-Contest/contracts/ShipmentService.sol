// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ShipmentService is Ownable {
    struct Order {
        uint256 pin;
        uint256 totalDeliveries;
        string status;
    }

    mapping(address => Order) private orders;

    //This function inititates the shipment
    function shipWithPin(address customerAddress, uint256 pin) public onlyOwner {
        // 999 and 10,000 (excluding those starting with 0)
        // require(bytes(pin.toString())[0] != '0');
        require(customerAddress != msg.sender, "Manager will not be a customer");
        require(pin > 999 && pin < 10000, "pin should be between 999 and 10000");
        require(customerAddress != address(0));
        require(!isStringEqual(orders[customerAddress].status, "shipped"), "One order already shipped");

        orders[customerAddress].pin = pin;
        orders[customerAddress].status = "shipped";
    }

    //This function acknowlegdes the acceptance of the delivery
    function acceptOrder(uint256 pin) public {
        require(msg.sender != owner(), "Manager can't able to accept any order");
        require(orders[msg.sender].pin == pin, "Wrong PIN");
        require(!isStringEqual(orders[msg.sender].status, "delivered"), "Order already delivered");
        orders[msg.sender].status = "delivered";
        ++orders[msg.sender].totalDeliveries;
    }

    //This function outputs the status of the delivery
    function checkStatus(address customerAddress) external view returns (string memory) {
        require(customerAddress != owner(), "Manager will not be a customer");
        require(
            customerAddress == msg.sender || msg.sender == owner(),
            "Customer can see only their own status and manager can see others "
        );
        return bytes(orders[customerAddress].status).length != 0 ? orders[customerAddress].status : "no order placed";
    }

    //This function outputs the total number of successful deliveries
    function totalCompletedDeliveries(address customerAddress) external view returns (uint256) {
        require(customerAddress != owner(), "Manager will not be a customer");
        require(
            customerAddress == msg.sender || msg.sender == owner(),
            "Customer can see only their own statusand manager can see others "
        );
        return orders[customerAddress].totalDeliveries;
    }

    // Helper function to compare two strings
    function isStringEqual(string memory a, string memory b) internal pure returns (bool) {
        return
            (bytes(a).length == bytes(b).length) && (keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b)));
    }
}
