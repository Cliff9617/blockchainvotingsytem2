const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying with:", deployer.address);

  const DeVoteNational = await hre.ethers.getContractFactory("DeVoteNational");

  const devote = await DeVoteNational.deploy();

  await devote.waitForDeployment();

  const address = await devote.getAddress();

  console.log("DeVoteNational deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});