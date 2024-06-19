const { run } = require("hardhat")

const verify = async (contractAddress, args) => {
    console.log("Verifying contract")
    try {
        await run("verify:verify", {
            //The verify:verify task automates this process by taking the contract's address and constructor arguments and submitting them to the blockchain explorer's API for verification.
            address: contractAddress,
            constructorArguments: args,
        })
    } catch (e) {
        if (e.message.toLowerCase().includes("already Verified")) {
            console.log("Already Verified!")
        } else {
            console.log(e)
        }
    }
}
module.exports = { verify }
