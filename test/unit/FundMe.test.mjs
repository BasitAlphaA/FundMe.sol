import hardhat from "hardhat"
const { ethers, deployments, getNamedAccounts } = hardhat
import { developmentChains } from "../../helper-hardhat-config.js"
// import { ethers } from "hardhat"
import { expect, assert } from "chai"
import * as chai from "chai"
import chaiAsPromised from "chai-as-promised"

chai.use(chaiAsPromised)

// const { use, assert: chaiAssert, expect: chaiExpect } = chai
!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", function () {
      let fundMe
      let mockV3Aggregator
      let deployer
      const amtToSend = ethers.utils.parseEther("1.0")
      beforeEach(async function () {
        const namedAccounts = await getNamedAccounts()
        deployer = namedAccounts.deployer

        await deployments.fixture(["all"])

        const fundMeDeployment = await deployments.get("FundMe")
        fundMe = await ethers.getContractAt("FundMe", fundMeDeployment.address)

        const mockV3AggregatorDeployment = await deployments.get(
          "MockV3Aggregator"
        )
        mockV3Aggregator = await ethers.getContractAt(
          "MockV3Aggregator",
          mockV3AggregatorDeployment.address
        )
        const deployerSigner = await ethers.getSigner(deployer)
        fundMe = fundMe.connect(deployerSigner)
        mockV3Aggregator = mockV3Aggregator.connect(deployerSigner)
      })

      describe("constructor", function () {
        it("Sets the addresses of Aggregator correctly", async () => {
          const response = await fundMe.getPriceFeed()
          assert.equal(response, mockV3Aggregator.address)
        })
      })
      describe("fallback and receive", function () {
        it("Call fund function when user send ether to the contract without a specific function call", async () => {
          // Simulate sending Ether to the contract without specifying a function call
          const initialContractBalance = await ethers.provider.getBalance(
            fundMe.address
          )
          const signer = await ethers.provider.getSigner()

          const response = await signer.sendTransaction({
            to: fundMe.address,
            value: amtToSend, // Sending 1 Ether as an example
          })
          await response.wait()

          const updatedContractValue = await ethers.provider.getBalance(
            fundMe.address
          )

          assert.equal(
            updatedContractValue.sub(initialContractBalance).toString(),
            amtToSend.toString()
          )

          const funderBalance = await fundMe.getAddressToAmountFunded(
            await signer.getAddress()
          )

          assert.equal(funderBalance.toString(), amtToSend.toString())

          // Check if the transaction was successful
        })
      })
      describe("fund", function () {
        it("tx fails when not enough eths are sent", async () => {
          //i used rejectedWith instead of revertedWith so i dont have to import solidity shit =>chai.use(solidity)

          await expect(fundMe.fund()).to.be.rejectedWith(
            "You need to spend more ETH!"
          )
        })
        it("update the amount funded structure", async () => {
          await fundMe.fund({ value: amtToSend })
          const response = await fundMe.getAddressToAmountFunded(deployer)
          assert.equal(response.toString(), amtToSend.toString())
        })
        it("Adds funders to array of funders", async () => {
          await fundMe.fund({ value: amtToSend })
          const funder = await fundMe.getFunder(0)
          assert.equal(funder, deployer)
        })
      })
      describe("withdraw", function () {
        beforeEach(async function () {
          await fundMe.fund({ value: amtToSend })
        })
        it("Withdraw ETH from single founder", async () => {
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          const txResponse = await fundMe.withdraw()
          const txReceipt = await txResponse.wait(1)

          const { effectiveGasPrice, gasUsed } = txReceipt
          // using .mul() and .add() because working with bigNumbers

          const gasAmount = effectiveGasPrice.mul(gasUsed)

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )

          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasAmount).toString()
          )
        })
        it("withdraw Eth for multiple funders", async () => {
          const accounts = await ethers.getSigners()
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i])
            await fundMeConnectedContract.fund({
              value: amtToSend,
            })
          }

          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          const txResponse = await fundMe.withdraw()
          const txReceipt = await txResponse.wait(1)

          const { effectiveGasPrice, gasUsed } = txReceipt
          // using .mul() and .add() because working with bigNumbers

          const gasAmount = effectiveGasPrice.mul(gasUsed)

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasAmount).toString()
          )

          await expect(fundMe.getFunder(0)).to.be.rejected

          for (let i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            )
          }
        })
        it("Only owner can withdraw", async function () {
          const accounts = await ethers.getSigner()
          const attacker = await accounts[1]
          const attackerConnectedContract = await fundMe.connect(attacker)
          await expect(attackerConnectedContract.withdraw()).to.be.rejected
        })
        it("cheaper withdraw......", async () => {
          const accounts = await ethers.getSigners()
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i])
            await fundMeConnectedContract.fund({
              value: amtToSend,
            })
          }

          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          const txResponse = await fundMe.cheaperWithdraw()
          const txReceipt = await txResponse.wait(1)

          const { effectiveGasPrice, gasUsed } = txReceipt
          // using .mul() and .add() because working with bigNumbers

          const gasAmount = effectiveGasPrice.mul(gasUsed)

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasAmount).toString()
          )

          await expect(fundMe.getFunder(0)).to.be.rejected

          for (let i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            )
          }
        })
      })
    })
