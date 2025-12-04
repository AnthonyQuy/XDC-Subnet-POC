// SPDX-License-Identifier: MIT

// Compatible with XDC Subnet
pragma solidity 0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NetworkManager
 * @dev Manages the membership and metadata of approved nodes in the XDC subnet.
 * This contract works in conjunction with an off-chain Private PKI/CA system.
 */
contract NetworkManager is Ownable {
    constructor() {}

    // Struct to store metadata about an approved network member.
    // The certificate itself is managed off-chain via PKI tools.
    struct NodeMember {
        string x500Name;          // e.g., "C=US, ST=CA, L=SF, O=MyOrg, CN=node-abc"
        address memberAddress;    // XDC/EVM address associated with the node
        bytes certSerialHex;      // Hex representation of the X.509 Certificate Serial Number (for revocation matching)
        bool isActive;            // Can this node participate in P2P consensus/communication?
        uint256 joinedAt;         
        uint256 lastUpdated;      
        uint16 platformVersion;   // e.g., version of the node software
        string host;              // Network host address (IP or DNS) for connection
        uint16 port;              // P2P/gRPC port
    }

    mapping(address => NodeMember) private members;
    mapping(address => uint256) private memberIndex;
    address[] private memberAddresses; // For easy iteration

    event MemberAdded(address indexed memberAddress, string x500Name, bytes certSerialHex);
    event MemberRemoved(address indexed memberAddress);
    event MemberUpdated(address indexed memberAddress);

    modifier memberExists(address memberAddress) {
        require(members[memberAddress].memberAddress != address(0), "Member does not exist");
        _;
    }

    modifier memberDoesNotExist(address memberAddress) {
        require(members[memberAddress].memberAddress == address(0), "Member already exists");
        _;
    }

    /**
     * @dev Owner adds a new approved member to the on-chain registry.
     * The off-chain PKI process must run in parallel to issue actual certificates.
     */
    function addMember(
        address memberAddress,
        string calldata x500Name,
        bytes calldata certSerialHex,
        uint16 platformVersion,
        string calldata host,
        uint16 port
    ) external onlyOwner memberDoesNotExist(memberAddress) {
        NodeMember memory newMember = NodeMember({
            x500Name: x500Name,
            memberAddress: memberAddress,
            certSerialHex: certSerialHex,
            isActive: true,
            joinedAt: block.timestamp,
            lastUpdated: block.timestamp,
            platformVersion: platformVersion,
            host: host,
            port: port
        });

        members[memberAddress] = newMember;
        memberIndex[memberAddress] = memberAddresses.length;
        memberAddresses.push(memberAddress);

        emit MemberAdded(memberAddress, x500Name, certSerialHex);
    }

    /**
     * @dev Removes a member. Requires manual certificate revocation off-chain.
     */
    function removeMember(address memberAddress) external onlyOwner memberExists(memberAddress) {
        uint256 index = memberIndex[memberAddress];
        address lastMember = memberAddresses[memberAddresses.length - 1];

        memberAddresses[index] = lastMember;
        memberIndex[lastMember] = index;

        memberAddresses.pop();
        delete memberIndex[memberAddress];
        delete members[memberAddress];

        emit MemberRemoved(memberAddress);
    }

    function updateMemberStatus(address memberAddress, bool isActive) external onlyOwner memberExists(memberAddress) {
        members[memberAddress].isActive = isActive;
        members[memberAddress].lastUpdated = block.timestamp;
        emit MemberUpdated(memberAddress);
    }

    /**
     * @dev Updates member details, including the new certificate serial number if re-issued.
     */
    function updateMemberDetails(
        address memberAddress,
        string calldata x500Name,
        bytes calldata certSerialHex,
        uint16 platformVersion,
        string calldata host,
        uint16 port
    ) external onlyOwner memberExists(memberAddress) {
        NodeMember storage member = members[memberAddress];
        member.x500Name = x500Name;
        member.certSerialHex = certSerialHex;
        member.platformVersion = platformVersion;
        member.host = host;
        member.port = port;
        member.lastUpdated = block.timestamp;

        emit MemberUpdated(memberAddress);
    }

    function getMember(address memberAddress) external view memberExists(memberAddress) returns (NodeMember memory) {
        return members[memberAddress];
    }

    function getAllMembers() external view returns (address[] memory) {
        return memberAddresses;
    }

    function isMember(address memberAddress) external view returns (bool) {
        return members[memberAddress].memberAddress != address(0);
    }
}
