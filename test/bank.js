const Bank = artifacts.require("Bank");
const truffleAssert = require('truffle-assertions');

contract("Bank", async (accounts) => {

    beforeEach('new contract for each test', async function () {
        bank = await Bank.new(accounts[0])
        let amount = 1000000;
        for (let index = 0; index < 10; index++) {
            await bank.deposit({ value: amount, from: accounts[index] });
        }
    })

    let owner = accounts[0];

    it("should deposit correctly", async () => {
        let amount = 1000000;
        let balance = await bank.balance({ from: accounts[1] });
        assert.equal(balance, amount);
    });

    it("should send amount correctly", async () => {
        let amount = 10000;
        let balanceSenderBefore = await bank.balance({ from: accounts[1] });
        let balanceReceiverBefore = await bank.balance({ from: accounts[2] });
        await bank.send(amount, accounts[2], { from: accounts[1] });
        let balanceSenderAfter = await bank.balance({ from: accounts[1] });
        let balanceReceiverAfter = await bank.balance({ from: accounts[2] });
        assert.equal(balanceReceiverAfter.toNumber(), balanceReceiverBefore.toNumber() + amount);
        assert.equal(balanceSenderAfter.toNumber(), balanceSenderBefore.toNumber() - amount);
    });

    it("should allow and check whitelist properly", async () => {
        await bank.allow(accounts[1], { from: owner });
        let allowedByOwner = await bank.isWhitelisted(accounts[1]);
        assert.equal(allowedByOwner, true);
        let notAllowedByOwner = await bank.isWhitelisted(accounts[2]);
        assert.equal(notAllowedByOwner, false);
        await truffleAssert.reverts(bank.allow(accounts[3], { from: accounts[2] }), 'Not owner');
    });

    it("should not send more than daily limit, if recipient is not whitelisted", async () => {
        let amount = 10001;
        await bank.setDailyLimit(10000);
        await truffleAssert.reverts(bank.send(amount, accounts[2], { from: accounts[1] }), "Non-whitelisted recipient or sender\'s daily limit reached");
    });

    it("should send more than daily limit, if recipient is whitelisted", async () => {
        let amount = 10001;
        await bank.allow(accounts[1], { from: owner });
        await bank.setDailyLimit(10000);
        let balanceSenderBefore = await bank.balance({ from: accounts[1] });
        await bank.send(amount, accounts[1], { from: accounts[2] });
        let balanceReceiverAfter = await bank.balance({ from: accounts[1] });
        assert.equal(balanceReceiverAfter.toNumber(), balanceSenderBefore.toNumber() + amount);
    });

    it("should handle daily limit spending properly for different accounts and multiple transactions", async () => {
        await bank.setDailyLimit(10000);
        await bank.send(5000, accounts[2], { from: accounts[1] });
        await bank.send(5000, accounts[2], { from: accounts[1] });
        await truffleAssert.reverts(bank.send(1, accounts[2], { from: accounts[1] }), "Non-whitelisted recipient or sender\'s daily limit reached");
        await bank.send(3000, accounts[4], { from: accounts[3] });
        await truffleAssert.reverts(bank.send(7001, accounts[4], { from: accounts[3] }), "Non-whitelisted recipient or sender\'s daily limit reached");
    });

    function increaseTime(duration) {
        const id = Date.now();

        return new Promise((resolve, reject) => {
            web3.currentProvider.send({
                jsonrpc: '2.0',
                method: 'evm_increaseTime',
                params: [duration],
                id: id,
            }, err1 => {
                if (err1) return reject(err1);

                web3.currentProvider.send({
                    jsonrpc: '2.0',
                    method: 'evm_mine',
                    id: id + 1,
                }, (err2, res) => {
                    return err2 ? reject(err2) : resolve(res);
                });
            });
        });
    }

    it("should reset daily limit after a day has passed", async () => {
        await bank.setDailyLimit(10000);
        await bank.send(5000, accounts[1], { from: accounts[2] });
        await truffleAssert.reverts(bank.send(5001, accounts[1], { from: accounts[2] }), "Non-whitelisted recipient or sender\'s daily limit reached");
        increaseTime(50); //some seconds after
        await truffleAssert.reverts(bank.send(5001, accounts[1], { from: accounts[2] }), "Non-whitelisted recipient or sender\'s daily limit reached");
        increaseTime(90000); //next day for sure
        await bank.send(5001, accounts[1], { from: accounts[2] });
    });

});
