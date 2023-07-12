const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const {
    constants,
    expectRevert,
} = require('@openzeppelin/test-helpers');

// 1. The smart contract will be deployed by the warehouse manager, who will act as the owner of the contract.
// 2. The owner, having access to the list of orders placed, will utilize the smart contract to mark an order as dispatched 
//    and initiate the shipping process through the shipping service.
// 3. While marking an order as dispatched in the smart contract, the owner will also enter a four-digit OTP (One-Time Password). 
//    The OTP can be any number between 999 and 10,000 (excluding those starting with 0).
// 4. Through some messaging service, the customer who is supposed to receive the order will be provided with the OTP. 
//    The customer will need to send the OTP to the smart contract to confirm the acceptance of the order upon its arrival at their address.
// 5. Using the smart contract, customers will be able to check the status of their orders, which is the number of orders which are shipped 
//    but yet to be delivered.
// 6. It is important to note that the owner's address cannot be considered a customer's address to maintain proper functionality 
//    and differentiation within the smart contract.
// 7. Multiple orders can be shipped to the same address without the nessecity of current order being successfully delivered.
// (Note : Multiple orders can be dispatched having the same pin as otp to a customer.)

/**
 * Input:
    shipWithPin(address customerAddress, uint pin) public: 
    
    This function can only be accessed by the owner (warehouse manager) and 
    is used to mark an order as dispatched. 
    The owner provides the customer's address and a four-digit OTP (pin) between 999 and 10,000 to verify the order.

    acceptOrder(uint pin) public returns (): 
    
    This function can only be accessed by the customer. 
    After receiving the shipment at their address, 
    the customer can mark the order as accepted by entering the OTP (pin) provided to them.
 */

/**
 * Output:
    checkStatus(address customerAddress) public returns (uint): 
    
    This function can only be accessed by the customer. 
    It returns the number of orders which are on the way to the customer with address 'customerAddress' 
    i.e. have been shipped from the warehouse, but haven't been recieved by the customer

    totalCompletedDeliveries(address customerAddress) public returns (uint):
    
    This function enables customers to determine the number of successfully completed deliveries to their specific address. 
    By providing their address, customers can retrieve the total count of completed deliveries. 
    The owner can also use this function to check the number of successfully completed deliveries for any address.
 */

describe("ShipmentServiceV2", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployShipmentServiceV2() {
        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await ethers.getSigners();

        const ShipmentService = await ethers.getContractFactory("ShipmentServiceV2");
        const shipmentService = await ShipmentService.deploy();

        return { shipmentService, owner, otherAccount };
    }

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            const { shipmentService, owner } = await loadFixture(deployShipmentServiceV2);

            expect(await shipmentService.owner()).to.equal(owner.address);
        });
    });

    describe("shipWithPin", function () {
        /**
         * 1. onlyOwner
         * 2. customerAddress != msg.sender
         * 3. pin > 999 && pin < 10000
         * 4. customerAddress != address(0)
         * 5. !isStringEqual(orders[customerAddress].status, "shipped"
         */
        it("Should revert with the right error if called as other account", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentServiceV2);

            await expect(shipmentService.connect(otherAccount).shipWithPin(otherAccount.address, 1234)).to.be.reverted;
        });
        it("Should succeed if called as owner", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentServiceV2);

            await expect(shipmentService.shipWithPin(otherAccount.address, 1234)).not.to.be.reverted;
        });
        it("Should revert with the right error if called with pin <= 999 or >=10000", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentServiceV2);

            await expect(shipmentService.shipWithPin(otherAccount.address, 999)).to.be.reverted;
            await expect(shipmentService.shipWithPin(otherAccount.address, 100)).to.be.reverted;
            await expect(shipmentService.shipWithPin(otherAccount.address, 10000)).to.be.reverted;
        });

        it("Should succeed if called with pin > 999 or <10000", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentServiceV2);

            await expect(shipmentService.shipWithPin(otherAccount.address, 9999)).not.to.be.reverted;
            await expect(shipmentService.shipWithPin(otherAccount.address, 9999)).to.be.reverted;
        });

        it("Should revert with the right error if called with address 0x00", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentServiceV2);

            await expect(shipmentService.shipWithPin(constants.ZERO_ADDRESS, 1234)).to.be.reverted;
        });

        it("Should revert if called if an order is already in shipment ", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentServiceV2);

            await expect(shipmentService.shipWithPin(otherAccount.address, 1234)).not.to.be.reverted;
            await expect(shipmentService.shipWithPin(otherAccount.address, 1234)).to.be.reverted;
        });
    })

    describe("acceptOrder", function () {
        /**
         * 1. msg.sender != owner()
         * 2. orders[msg.sender].pin == pin
         * 3. !isStringEqual(orders[msg.sender].status
         * 
         */
        it("Should revert with the right error if called by owner", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentServiceV2);

            await expect(shipmentService.acceptOrder(1234)).to.be.reverted;
        });

        it("Should revert with the right error if called with wrong pin", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentServiceV2);

            await expect(shipmentService.connect(otherAccount).acceptOrder(1234)).to.be.reverted;
        });

        it("Should succeed if called with correct pin", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentServiceV2);

            await expect(shipmentService.shipWithPin(otherAccount.address, 9999)).not.to.be.reverted;
            await expect(shipmentService.connect(otherAccount).acceptOrder(1234)).to.be.reverted;
            await expect(shipmentService.connect(otherAccount).acceptOrder(9999)).not.to.be.reverted;
            await expect(shipmentService.connect(otherAccount).acceptOrder(9999)).to.be.reverted;
        });
    });

    describe("checkStatus", function () {
        /**
         * 1. customerAddress != owner()
         * 2. customerAddress == msg.sender 
         * 3. msg.sender == owner()
         */
        it("Should revert with the right error if called with Manager address", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentServiceV2);

            await expect(shipmentService.checkStatus(owner.address)).to.be.reverted;
        });
        it("Should succeed if called with otherAccount address by Manager", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentServiceV2);
            await expect(await shipmentService.checkStatus(otherAccount.address)).to.equal(0);
        });
        it("Should revert with the right error if called with one customer address by another customer", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentServiceV2);

            await expect(shipmentService.connect(otherAccount).checkStatus(owner.address)).to.be.reverted;
        });
        it("Should give the status 'no order placed' if called with otherAccount address by customer", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentServiceV2);

            await expect(await shipmentService.connect(otherAccount).checkStatus(otherAccount.address)).to.equal(0);
        });

        it("Should give the status 'shipped' if called with otherAccount address by customer", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentServiceV2);

            await expect(shipmentService.shipWithPin(otherAccount.address, 9999)).not.to.be.reverted;
            await expect(await shipmentService.connect(otherAccount).checkStatus(otherAccount.address)).to.equal(1);

            await expect(shipmentService.shipWithPin(otherAccount.address, 9998)).not.to.be.reverted;
            await expect(await shipmentService.connect(otherAccount).checkStatus(otherAccount.address)).to.equal(2);
        });

        it("Should give the status 'delivered' if called with otherAccount address by customer", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentServiceV2);

            await expect(shipmentService.shipWithPin(otherAccount.address, 1234)).not.to.be.reverted;
            await expect(await shipmentService.connect(otherAccount).checkStatus(otherAccount.address)).to.equal(1);
            await expect(shipmentService.connect(otherAccount).acceptOrder(1234)).not.to.be.reverted;
            await expect(await shipmentService.connect(otherAccount).checkStatus(otherAccount.address)).to.equal(0);
        });
    });

    describe("totalCompletedDeliveries", function(){
        /**
         * 1. customerAddress != owner()
         * 2. customerAddress == msg.sender
         * 3. msg.sender == owner()
         */
        it("Should revert with the right error if called with Manager address", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentServiceV2);

            await expect(shipmentService.totalCompletedDeliveries(owner.address)).to.be.reverted;
        });

        it("Should revert with the right error if called with one customer address by another customer", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentServiceV2);

            await expect(shipmentService.connect(otherAccount).totalCompletedDeliveries(owner.address)).to.be.reverted;
        });

        it("Should revert with the right error if called with one customer address by another customer", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentServiceV2);

            await expect(shipmentService.totalCompletedDeliveries(otherAccount.address)).not.to.be.reverted;
        });

        it("Should give the delivery count if called with otherAccount address by customer", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentServiceV2);

            await expect(shipmentService.shipWithPin(otherAccount.address, 1234)).not.to.be.reverted;
            await expect(await shipmentService.connect(otherAccount).checkStatus(otherAccount.address)).to.equal(1);
            await expect(shipmentService.connect(otherAccount).acceptOrder(1234)).not.to.be.reverted;
            await expect(await shipmentService.connect(otherAccount).checkStatus(otherAccount.address)).to.equal(0);
            await expect(await shipmentService.connect(otherAccount).totalCompletedDeliveries(otherAccount.address)).to.equal(1);

            await expect(shipmentService.shipWithPin(otherAccount.address, 1234)).not.to.be.reverted;
            await expect(await shipmentService.connect(otherAccount).checkStatus(otherAccount.address)).to.equal(1);
            await expect(shipmentService.connect(otherAccount).acceptOrder(1234)).not.to.be.reverted;
            await expect(await shipmentService.connect(otherAccount).checkStatus(otherAccount.address)).to.equal(0);
            await expect(await shipmentService.connect(otherAccount).totalCompletedDeliveries(otherAccount.address)).to.equal(2);
        });
    });
});
