// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PDCA {
    struct Certificate {
        string did;            // Decentralized Identifier
        string issuedBy;       // Issuer
        uint256 issuedAt;      // Timestamp of issuance
        uint256 expiresAt;     // Expiration time
        bool isValid;          // Status of the certificate
    }

    mapping(string => Certificate) public certificates;  // Store certificates by DID
    address public admin;  // PDCA Admin (Issuer)

    event CertificateIssued(string did, string issuedBy, uint256 issuedAt, uint256 expiresAt);
    event CertificateRevoked(string did);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    constructor() {
        admin = msg.sender; // Set the contract deployer as the admin
    }

    // Issue a new certificate
    function issueCertificate(string memory _did, uint256 _validityPeriod) public onlyAdmin {
        require(certificates[_did].issuedAt == 0, "Certificate already exists");

        certificates[_did] = Certificate({
            did: _did,
            issuedBy: "PDCA Authority",
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + _validityPeriod,
            isValid: true
        });

        emit CertificateIssued(_did, "PDCA Authority", block.timestamp, block.timestamp + _validityPeriod);
    }

    // Verify if a certificate is valid
    function verifyCertificate(string memory _did) public view returns (bool) {
        Certificate memory cert = certificates[_did];
        return cert.isValid && (block.timestamp < cert.expiresAt);
    }

    // Revoke a certificate
    function revokeCertificate(string memory _did) public onlyAdmin {
        require(certificates[_did].isValid, "Certificate is already revoked or does not exist");

        certificates[_did].isValid = false;
        emit CertificateRevoked(_did);
    }

    // Get certificate details
    function getCertificate(string memory _did) public view returns (string memory, string memory, uint256, uint256, bool) {
        Certificate memory cert = certificates[_did];
        return (cert.did, cert.issuedBy, cert.issuedAt, cert.expiresAt, cert.isValid);
    }
}
