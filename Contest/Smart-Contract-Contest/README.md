# Contest - I

## 1. Shipment Service (easy)

A shipment service is having trouble tracking orders, which is causing issues for customers. To make things better, they are moving their database to a smart contract-based blockchain solution. This will make the process more transparent and efficient, and help with order management.

### Process:


1. The smart contract will be deployed by the warehouse manager, who will act as the owner of the contract.
2. The owner, having access to the list of orders placed, will utilize the smart contract to mark an order as dispatched and initiate the shipping process through the shipping service.
3. While marking an order as dispatched in the smart contract, the owner will also enter a four-digit OTP (One-Time Password). The OTP can be any number between 999 and 10,000 (excluding those starting with 0).
4. Through some messaging service, the customer who is supposed to receive the order will be provided with the OTP. The customer will need to send the OTP to the smart contract to confirm the acceptance of the order upon its arrival at their address.
5. Using the smart contract, customers will be able to check the status of their orders. The possible order statuses are as follows:
"no orders placed" if the customer has not placed any orders.
"shipped" if the order has been dispatched.
"delivered" if the last order has been successfully delivered.
6. It is important to note that the owner's address cannot be considered a customer's address to maintain proper functionality and differentiation within the smart contract.
7. For ease of implementation, in this phase of migration, until one order is completely delivered, another order cannot be dispatched to the same address.

### The smart contract must contain the following public functions:

 

## Input:
**shipWithPin(address customerAddress, uint pin) public:** This function can only be accessed by the owner (warehouse manager) and is used to mark an order as dispatched. The owner provides the customer's address and a four-digit OTP (pin) between 999 and 10,000 to verify the order.

**acceptOrder(uint pin) public returns ():** This function can only be accessed by the customer. After receiving the shipment at their address, the customer can mark the order as accepted by entering the OTP (pin) provided to them.

 

## Output:
**checkStatus(address customerAddress) public returns (string):** This function allows customers to check the status of their own orders by providing their address. It returns a string indicating the status of the order. Possible status values include:

1. "no orders placed" if the customer has not placed any orders.
2. "shipped" if the order has been dispatched.
3. "delivered" if the last order has been successfully delivered.

**totalCompletedDeliveries(address customerAddress) public returns (uint):** This function enables customers to determine the number of successfully completed deliveries to their specific address. By providing their address, customers can retrieve the total count of completed deliveries. The owner can also use this function to check the number of successfully completed deliveries for any address.

 

Implement the required smart contract to help the shipment service migrate the database.

 

### Example 1

| Input/Output | Function                   | Sender address | Parameter          | Returns     |
|--------------|----------------------------|----------------|--------------------|-------------|
| Input        | shipWithPin()              | Owner          | (<Address 1>,1220) |             |
| Input        | acceptOrder()              | Address 1      | (1220)             |             |
| Output       | checkStatus()              | Owner          | (<Address 1>)      | "delivered" |
| Output       | totalCompletedDeliveries() | Owner          | (<Address 1>)      |      1      |


 ## 2. Shipment Service (hard)

 A shipment service is having trouble tracking orders, which is causing issues for customers. To make things better, they are moving their database to a smart contract-based blockchain solution. This will make the process more transparent and efficient, and help with order management.

### Process:


1. The smart contract will be deployed by the warehouse manager, who will act as the owner of the contract.
2. The owner, having access to the list of orders placed, will utilize the smart contract to mark an order as dispatched and initiate the shipping process through the shipping service.
3. While marking an order as dispatched in the smart contract, the owner will also enter a four-digit OTP (One-Time Password). The OTP can be any number between 999 and 10,000 (excluding those starting with 0).
4. Through some messaging service, the customer who is supposed to receive the order will be provided with the OTP. The customer will need to send the OTP to the smart contract to confirm the acceptance of the order upon its arrival at their address.
5. Using the smart contract, customers will be able to check the status of their orders, which is the number of orders which are shipped but yet to be delivered.
6. It is important to note that the owner's address cannot be considered a customer's address to maintain proper functionality and differentiation within the smart contract.
7. Multiple orders can be shipped to the same address without the nessecity of current order being successfully delivered.
(Note : Multiple orders can be dispatched having the same pin as otp to a customer.)

The smart contract must contain the following public functions:

 

## Input:
**shipWithPin(address customerAddress, uint pin) public:** This function can only be accessed by the owner (warehouse manager) and is used to mark an order as dispatched. The owner provides the customer's address and a four-digit OTP (pin) between 999 and 10,000 to verify the order.

**acceptOrder(uint pin) public returns ():** This function can only be accessed by the customer. After receiving the shipment at their address, the customer can mark the order as accepted by entering the OTP (pin) provided to them.

 

### Output:
**checkStatus(address customerAddress) public returns (uint):** This function can only be accessed by the customer. It returns the number of orders which are on the way to the customer with address 'customerAddress' i.e. have been shipped from the warehouse, but haven't been recieved by the customer

**totalCompletedDeliveries(address customerAddress) public returns (uint):**This function enables customers to determine the number of successfully completed deliveries to their specific address. By providing their address, customers can retrieve the total count of completed deliveries. The owner can also use this function to check the number of successfully completed deliveries for any address.

 

Implement the required smart contract to help the shipment service migrate the database.

 

### Example 1

| Input/Output | Function                   | Sender address | Parameter          | Returns     |
|--------------|----------------------------|----------------|--------------------|-------------|
| Input        | shipWithPin()              | Owner          | (<Address 1>,1220) |             |
| Input        | acceptOrder()              | Address 1      | (1220)             |             |
| Output       | checkStatus()              | Owner          | (<Address 1>)      |      0      |
| Output       | totalCompletedDeliveries() | Address 1      | (<Address 1>)      |      1      |


# How to run

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat test
```


