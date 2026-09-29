import { ethers } from "hardhat";

async function main() {
  const Registry = await ethers.getContractFactory("PartRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log(`PartRegistry deployed to: ${address}`);

  // Register a part to create a tx hash for MSTScan
  const [deployer] = await ethers.getSigners();
  // Admin is already OEM by constructor if we grant it? No, we need to grant it.
  await registry.grantRole(await registry.OEM_ROLE(), deployer.address);

  const partIdHash = ethers.id("HP47291");
  const docHash = ethers.id("DOC_ROOT_HASH");

  const tx = await registry.registerPart(partIdHash, "BATCH-001", docHash);
  await tx.wait();

  console.log(`RegisterPart Tx Hash: ${tx.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
