import hardhat from "hardhat"
const { ethers, deployments, getNamedAccounts, network } = hardhat
import { developmentChains } from "../../helper-hardhat-config.js"
import { expect, assert } from "chai"
import * as chai from "chai"
import chaiAsPromised from "chai-as-promised"

chai.use(chaiAsPromised)

developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe Staging Tests", function () {
      let deployer
      let fundMe
      const sendValue = ethers.utils.parseEther("0.05")

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer
        const fundMeDeployment = await deployments.get("FundMe")
        const deployerSigner = await ethers.getSigner(deployer)

        fundMe = await ethers.getContractAt(
          "FundMe",
          fundMeDeployment.address,
          deployerSigner
        )
      })

      it("allows people to fund and withdraw", async function () {
        // Get initial contract balance
        const initialMeBalance = await fundMe.provider.getBalance(
          fundMe.address
        )
        console.log(`Initial FundMe balance: ${initialMeBalance.toString()}`)

        // Fund the contract
        await fundMe.fund({ value: sendValue })

        // Get balance after funding
        const fundedMeBalance = await fundMe.provider.getBalance(fundMe.address)
        console.log(`Funded FundMe balance: ${fundedMeBalance.toString()}`)
        assert.equal(fundedMeBalance.toString(), sendValue.toString())

        // Withdraw from the contract
        await fundMe.withdraw()

        // Get balance after withdrawal
        const endingMeBalance = await fundMe.provider.getBalance(fundMe.address)
        console.log(`Ending FundMe balance: ${endingMeBalance.toString()}`)
        assert.equal(endingMeBalance.toString(), "0")
      })
    })
