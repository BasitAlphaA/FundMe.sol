import hardhat from "hardhat"
const { ethers, getNamedAccounts } = hardhat

async function main() {
  const [deployer] = await ethers.getSigners()
  const fundMeDeployment = await deployments.get("FundMe")
  const fundMe = await ethers.getContractAt("FundMe", fundMeDeployment.address)
  console.log("funding contract...")
  const txresponse = await fundMe.fund({
    value: ethers.utils.parseEther("0.1"),
  })
  await txresponse.wait(1)
  console.log("FUNDED!")
  const curBalance = await fundMe.provider.getBalance(fundMe.address)
  console.log(`the current balance is ${curBalance}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
