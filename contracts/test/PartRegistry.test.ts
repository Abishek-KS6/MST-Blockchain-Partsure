import { expect } from "chai";
import { ethers } from "hardhat";
import { PartRegistry } from "../typechain-types"; // Note: this will be generated

describe("PartRegistry", function () {
  let registry: PartRegistry;
  let admin: any, oem: any, supplier: any, factory: any, service: any, arbiter: any;
  const partIdHash = ethers.id("PART123");
  const docHash = ethers.id("DOC123");

  beforeEach(async function () {
    [admin, oem, supplier, factory, service, arbiter] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("PartRegistry");
    registry = await Registry.deploy();

    await registry.grantRole(registry.OEM_ROLE(), oem.address);
    await registry.grantRole(registry.SUPPLIER_ROLE(), supplier.address);
    await registry.grantRole(registry.FACTORY_ROLE(), factory.address);
    await registry.grantRole(registry.SERVICE_ROLE(), service.address);
    await registry.grantRole(registry.ARBITER_ROLE(), arbiter.address);
  });

  describe("Registration", function () {
    it("should allow OEM to register a part", async function () {
      await expect(registry.connect(oem).registerPart(partIdHash, "BATCH1", docHash))
        .to.emit(registry, "LifecycleEvent")
        .withArgs(oem.address, partIdHash, docHash, "register", anyValue);
    });

    it("should deny non-OEM from registering", async function () {
      await expect(registry.connect(supplier).registerPart(partIdHash, "BATCH1", docHash))
        .to.be.revertedWith("Caller is not OEM");
    });
  });

  describe("Transitions", function () {
    beforeEach(async function () {
      await registry.connect(oem).registerPart(partIdHash, "BATCH1", docHash);
    });

    it("should allow holder to transfer custody", async function () {
      await registry.connect(oem).transferCustody(partIdHash, supplier.address, docHash);
      expect(await registry.parts(partIdHash)).to.have.property("currentHolder", supplier.address);
    });

    it("should deny non-holder from transferring", async function () {
      await expect(registry.connect(supplier).transferCustody(partIdHash, arbiter.address, docHash))
        .to.be.revertedWith("Caller is not current holder");
    });

    it("should allow factory to install if holder", async function () {
      await registry.connect(oem).transferCustody(partIdHash, factory.address, docHash);
      await registry.connect(factory).recordInstall(partIdHash, "MACH1", docHash);
      expect(await registry.parts(partIdHash)).to.have.property("status", 2); // Installed
    });

    it("should deny factory install if not holder", async function () {
      await expect(registry.connect(factory).recordInstall(partIdHash, "MACH1", docHash))
        .to.be.revertedWith("FACTORY must hold the part to install it");
    });
  });

  describe("Claims", function () {
    beforeEach(async function () {
      await registry.connect(oem).registerPart(partIdHash, "BATCH1", docHash);
    });

    it("should allow arbiter to resolve claim", async function () {
      await registry.connect(arbiter).resolveClaim(partIdHash, true, docHash);
      expect(await registry.parts(partIdHash)).to.have.property("status", 4); // Failed
    });

    it("should deny non-arbiter from resolving", async function () {
      await expect(registry.connect(oem).resolveClaim(partIdHash, true, docHash))
        .to.be.revertedWith("Caller is not ARBITER");
    });
  });
});

function anyValue() {
  return (val: any) => true;
}
