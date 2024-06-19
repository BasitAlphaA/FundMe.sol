import hardhat from "hardhat"
const { ethers, getNamedAccounts } = hardhat

async function main() {
  const [deployer] = await ethers.getSigners()
  const fundMeDeployment = await deployments.get("FundMe")
  const fundMe = await ethers.getContractAt("FundMe", fundMeDeployment.address)
  console.log("withdrawing from contract...")
  const txresponse = await fundMe.withdraw()
  await txresponse.wait(1)
  console.log("withdrawed!")
  const curBalance = await fundMe.provider.getBalance(fundMe.address)
  console.log(`the current balance is ${curBalance}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
