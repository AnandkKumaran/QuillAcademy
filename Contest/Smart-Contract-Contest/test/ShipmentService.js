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

describe("ShipmentService", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployShipmentService() {
        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await ethers.getSigners();

        const ShipmentService = await ethers.getContractFactory("ShipmentService");
        const shipmentService = await ShipmentService.deploy();

        return { shipmentService, owner, otherAccount };
    }

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            const { shipmentService, owner } = await loadFixture(deployShipmentService);

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
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentService);

            await expect(shipmentService.connect(otherAccount).shipWithPin(otherAccount.address, 1234)).to.be.reverted;
        });
        it("Should succeed if called as owner", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentService);

            await expect(shipmentService.shipWithPin(otherAccount.address, 1234)).not.to.be.reverted;
        });
        it("Should revert with the right error if called with pin <= 999 or >=10000", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentService);

            await expect(shipmentService.shipWithPin(otherAccount.address, 999)).to.be.reverted;
            await expect(shipmentService.shipWithPin(otherAccount.address, 100)).to.be.reverted;
            await expect(shipmentService.shipWithPin(otherAccount.address, 10000)).to.be.reverted;
        });

        it("Should succeed if called with pin > 999 or <10000", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentService);

            await expect(shipmentService.shipWithPin(otherAccount.address, 9999)).not.to.be.reverted;
        });

        it("Should revert with the right error if called with address 0x00", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentService);

            await expect(shipmentService.shipWithPin(constants.ZERO_ADDRESS, 1234)).to.be.reverted;
        });

        it("Should revert if called if an order is already in shipment ", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentService);

            await expect(shipmentService.shipWithPin(otherAccount.address, 1234)).not.to.be.reverted;
            await expect(shipmentService.shipWithPin(otherAccount.address, 1235)).to.be.reverted;
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
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentService);

            await expect(shipmentService.acceptOrder(1234)).to.be.reverted;
        });

        it("Should revert with the right error if called with wrong pin", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentService);

            await expect(shipmentService.connect(otherAccount).acceptOrder(1234)).to.be.reverted;
        });

        it("Should succeed if called with correct pin", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentService);

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
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentService);

            await expect(shipmentService.checkStatus(owner.address)).to.be.reverted;
        });
        it("Should succeed if called with otherAccount address by Manager", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentService);

            await expect(await shipmentService.checkStatus(otherAccount.address)).to.equal('no order placed');
        });
        it("Should revert with the right error if called with one customer address by another customer", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentService);

            await expect(shipmentService.connect(otherAccount).checkStatus(owner.address)).to.be.reverted;
        });
        it("Should give the status 'no order placed' if called with otherAccount address by customer", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentService);

            await expect(await shipmentService.connect(otherAccount).checkStatus(otherAccount.address)).to.equal('no order placed');
        });

        it("Should give the status 'shipped' if called with otherAccount address by customer", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentService);

            await expect(shipmentService.shipWithPin(otherAccount.address, 9999)).not.to.be.reverted;
            await expect(await shipmentService.connect(otherAccount).checkStatus(otherAccount.address)).to.equal('shipped');
        });

        it("Should give the status 'delivered' if called with otherAccount address by customer", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentService);

            await expect(shipmentService.shipWithPin(otherAccount.address, 1234)).not.to.be.reverted;
            await expect(shipmentService.connect(otherAccount).acceptOrder(1234)).not.to.be.reverted;
            await expect(await shipmentService.connect(otherAccount).checkStatus(otherAccount.address)).to.equal('delivered');
        });
    });

    describe("totalCompletedDeliveries", function(){
        /**
         * 1. customerAddress != owner()
         * 2. customerAddress == msg.sender
         * 3. msg.sender == owner()
         */
        it("Should revert with the right error if called with Manager address", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentService);

            await expect(shipmentService.totalCompletedDeliveries(owner.address)).to.be.reverted;
        });

        it("Should revert with the right error if called with one customer address by another customer", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentService);

            await expect(shipmentService.connect(otherAccount).totalCompletedDeliveries(owner.address)).to.be.reverted;
        });

        it("Should revert with the right error if called with one customer address by another customer", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentService);

            await expect(shipmentService.totalCompletedDeliveries(otherAccount.address)).not.to.be.reverted;
        });

        it("Should give the delivery count if called with otherAccount address by customer", async function () {
            const { shipmentService, owner, otherAccount } = await loadFixture(deployShipmentService);

            await expect(shipmentService.shipWithPin(otherAccount.address, 1234)).not.to.be.reverted;
            await expect(await shipmentService.connect(otherAccount).checkStatus(otherAccount.address)).to.equal('shipped');
            await expect(shipmentService.connect(otherAccount).acceptOrder(1234)).not.to.be.reverted;
            await expect(await shipmentService.connect(otherAccount).checkStatus(otherAccount.address)).to.equal('delivered');
            await expect(await shipmentService.connect(otherAccount).totalCompletedDeliveries(otherAccount.address)).to.equal(1);

            await expect(shipmentService.shipWithPin(otherAccount.address, 1234)).not.to.be.reverted;
            await expect(await shipmentService.connect(otherAccount).checkStatus(otherAccount.address)).to.equal('shipped');
            await expect(shipmentService.connect(otherAccount).acceptOrder(1234)).not.to.be.reverted;
            await expect(await shipmentService.connect(otherAccount).checkStatus(otherAccount.address)).to.equal('delivered');
            await expect(await shipmentService.connect(otherAccount).totalCompletedDeliveries(otherAccount.address)).to.equal(2);
        });
    });
});
