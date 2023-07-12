// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ShipmentServiceV2 is Ownable {
    struct Order {
        mapping(uint256 => string) orders; // {pin,status}
        uint256 totalShipped;
        uint256 totalDelivered;
    }

    mapping(address => Order) private customers;

    //This function inititates the shipment
    function shipWithPin(address customerAddress, uint256 pin) external onlyOwner {
        // 999 and 10,000 (excluding those starting with 0)
        // require(bytes(pin.toString())[0] != '0');
        require(customerAddress != msg.sender, "Manager will not be a customer");
        require(pin > 999 && pin < 10000, "pin should be between 999 and 10000");
        require(customerAddress != address(0));
        require(
            !isStringEqual(customers[customerAddress].orders[pin], "shipped"), "One order already shipped with this pin"
        );

        customers[customerAddress].orders[pin] = "shipped";
        ++customers[customerAddress].totalShipped;
    }

    //This function acknowlegdes the acceptance of the delivery
    function acceptOrder(uint256 pin) public {
        require(msg.sender != owner(), "Manager can't able to accept any order");
        require(bytes(customers[msg.sender].orders[pin]).length != 0, "Wrong PIN");
        require(isStringEqual(customers[msg.sender].orders[pin], "shipped"), "Order already delivered");
        customers[msg.sender].orders[pin] = "delivered";
        customers[msg.sender].totalShipped -= customers[msg.sender].totalShipped == 0 ? 0 : 1;
        ++customers[msg.sender].totalDelivered;
    }

    //This function outputs the status of the delivery
    function checkStatus(address customerAddress) external view returns (uint256) {
        require(customerAddress != owner(), "Manager will not be a customer");
        require(
            customerAddress == msg.sender || msg.sender == owner(),
            "Customer can see only their own status and manager can see others "
        );
        return customers[customerAddress].totalShipped;
    }

    //This function outputs the total number of successful deliveries
    function totalCompletedDeliveries(address customerAddress) external view returns (uint256) {
        require(customerAddress != owner(), "Manager will not be a customer");
        require(
            customerAddress == msg.sender || msg.sender == owner(),
            "Customer can see only their own statusand manager can see others "
        );
        return customers[customerAddress].totalDelivered;
    }

    // Helper function to compare two strings
    function isStringEqual(string memory a, string memory b) internal pure returns (bool) {
        return
            (bytes(a).length == bytes(b).length) && (keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b)));
    }
}
