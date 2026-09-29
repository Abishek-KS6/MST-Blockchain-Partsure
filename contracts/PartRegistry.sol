// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PartRegistry {
    bytes32 public constant OEM_ROLE = keccak256("OEM_ROLE");
    bytes32 public constant SUPPLIER_ROLE = keccak256("SUPPLIER_ROLE");
    bytes32 public constant FACTORY_ROLE = keccak256("FACTORY_ROLE");
    bytes32 public constant SERVICE_ROLE = keccak256("SERVICE_ROLE");
    bytes32 public constant ARBITER_ROLE = keccak256("ARBITER_ROLE");

    enum PartStatus { Unregistered, Active, Installed, Retired, Failed }

    struct Part {
        address currentHolder;
        PartStatus status;
        bool exists;
    }

    mapping(bytes32 => Part) public parts;
    mapping(address => bool) public isAdmin;
    mapping(bytes32 => mapping(address => bool)) private _roles;

    event LifecycleEvent(
        address indexed actor,
        bytes32 indexed partIdHash,
        bytes32 docHash,
        string eventType,
        uint256 timestamp
    );

    constructor() {
        isAdmin[msg.sender] = true;
    }

    function grantRole(bytes32 role, address account) external {
        require(isAdmin[msg.sender], "Not admin");
        _roles[role][account] = true;
    }

    function hasRole(bytes32 role, address account) public view returns (bool) {
        return _roles[role][account];
    }

    function registerPart(bytes32 partIdHash, string calldata batchId, bytes32 docHash) external {
        require(hasRole(OEM_ROLE, msg.sender), "Caller is not OEM");
        require(!parts[partIdHash].exists, "Part already registered");

        parts[partIdHash] = Part({
            currentHolder: msg.sender,
            status: PartStatus.Active,
            exists: true
        });

        emit LifecycleEvent(msg.sender, partIdHash, docHash, "register", block.timestamp);
    }

    function transferCustody(bytes32 partIdHash, address toOrg, bytes32 docHash) external {
        Part storage part = parts[partIdHash];
        require(part.exists, "Part not registered");
        require(part.currentHolder == msg.sender, "Caller is not current holder");
        require(part.status != PartStatus.Retired, "Cannot transfer retired part");

        part.currentHolder = toOrg;

        emit LifecycleEvent(msg.sender, partIdHash, docHash, "transfer", block.timestamp);
    }

    function recordInstall(bytes32 partIdHash, string calldata machineRef, bytes32 docHash) external {
        require(hasRole(FACTORY_ROLE, msg.sender), "Caller is not FACTORY");
        Part storage part = parts[partIdHash];
        require(part.exists, "Part not registered");
        require(part.currentHolder == msg.sender, "FACTORY must hold the part to install it");
        require(part.status == PartStatus.Active, "Part must be Active to install");

        part.status = PartStatus.Installed;

        emit LifecycleEvent(msg.sender, partIdHash, docHash, "install", block.timestamp);
    }

    function recordService(bytes32 partIdHash, uint256 operatingHours, bytes32 docHash) external {
        require(hasRole(SERVICE_ROLE, msg.sender), "Caller is not SERVICE");
        Part storage part = parts[partIdHash];
        require(part.exists, "Part not registered");
        require(part.status != PartStatus.Retired, "Cannot service retired part");

        emit LifecycleEvent(msg.sender, partIdHash, docHash, "service", block.timestamp);
    }

    function fileClaim(bytes32 partIdHash, bytes32 docHash) external {
        Part storage part = parts[partIdHash];
        require(part.exists, "Part not registered");
        require(
            hasRole(FACTORY_ROLE, msg.sender) || part.currentHolder == msg.sender,
            "Only FACTORY or current holder can file claim"
        );

        emit LifecycleEvent(msg.sender, partIdHash, docHash, "claim", block.timestamp);
    }

    function resolveClaim(bytes32 partIdHash, bool accepted, bytes32 docHash) external {
        require(hasRole(ARBITER_ROLE, msg.sender), "Caller is not ARBITER");
        Part storage part = parts[partIdHash];
        require(part.exists, "Part not registered");

        if (accepted) {
            part.status = PartStatus.Failed;
        }

        emit LifecycleEvent(msg.sender, partIdHash, docHash, "resolve", block.timestamp);
    }

    function flagSuspect(bytes32 partIdHash, bytes32 reasonHash) external {
        require(
            hasRole(OEM_ROLE, msg.sender) ||
            hasRole(SUPPLIER_ROLE, msg.sender) ||
            hasRole(FACTORY_ROLE, msg.sender) ||
            hasRole(SERVICE_ROLE, msg.sender) ||
            hasRole(ARBITER_ROLE, msg.sender),
            "Caller does not have a registered role"
        );
        require(parts[partIdHash].exists, "Part not registered");

        emit LifecycleEvent(msg.sender, partIdHash, 0, "flag_suspect", block.timestamp);
    }
}
