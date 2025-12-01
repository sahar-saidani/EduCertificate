// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/**
 * @title EduCert - Certification décentralisée sur Ethereum
 * @dev Permet aux institutions d'émettre des certificats blockchain,
 * aux étudiants de les posséder, et aux recruteurs de les vérifier.
 */

contract EduCert {

    // -----------------------------
    //         STRUCTURES
    // -----------------------------

    struct Certificate {
        uint256 id;
        address institution;
        address student;
        string studentName;
        string degree;
        string issuedDate;
        bool isValid;
    }

    // -----------------------------
    //        VARIABLES GLOBALES
    // -----------------------------

    uint256 private nextCertificateId = 1;

    // idCertificat => Certificate
    mapping(uint256 => Certificate) public certificates;

    // adresseStudent => liste d'idCertificat
    mapping(address => uint256[]) public certificatesByStudent;

    // liste d’institutions autorisées
    mapping(address => bool) public isInstitution;

    // owner du contrat
    address public admin;


    // -----------------------------
    //          EVENTS
    // -----------------------------

    event InstitutionAdded(address institutionAddress);
    event CertificateIssued(uint256 certificateId, address student, string degree);
    event CertificateRevoked(uint256 certificateId);


    // -----------------------------
    //          MODIFIERS
    // -----------------------------

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyInstitution() {
        require(isInstitution[msg.sender], "You must be an authorized institution");
        _;
    }


    // -----------------------------
    //        CONSTRUCTEUR
    // -----------------------------

    constructor() {
        admin = msg.sender;
    }


    // -----------------------------
    //     GESTION DES INSTITUTIONS
    // -----------------------------

    function addInstitution(address _institution) external onlyAdmin {
        isInstitution[_institution] = true;
        emit InstitutionAdded(_institution);
    }


    // -----------------------------
    //       ISSUE CERTIFICATE
    // -----------------------------

    function issueCertificate(
        address student,
        string memory studentName,
        string memory degree,
        string memory issuedDate
    ) external onlyInstitution returns (uint256) {

        uint256 certId = nextCertificateId++;

        certificates[certId] = Certificate({
            id: certId,
            institution: msg.sender,
            student: student,
            studentName: studentName,
            degree: degree,
            issuedDate: issuedDate,
            isValid: true
        });

        certificatesByStudent[student].push(certId);

        emit CertificateIssued(certId, student, degree);
        return certId;
    }


    // -----------------------------
    //        VERIFY CERTIFICATE
    // -----------------------------

    function verifyCertificate(uint256 certId)
        external
        view
        returns (
            bool valid,
            address institution,
            address student,
            string memory studentName,
            string memory degree,
            string memory issuedDate
        )
    {
        Certificate memory cert = certificates[certId];
        require(cert.id != 0, "Certificate not found");

        return (
            cert.isValid,
            cert.institution,
            cert.student,
            cert.studentName,
            cert.degree,
            cert.issuedDate
        );
    }


    // -----------------------------
    //  LIST CERTIFICATES BY STUDENT
    // -----------------------------

    function getCertificatesByStudent(address student)
        external
        view
        returns (uint256[] memory)
    {
        return certificatesByStudent[student];
    }


    // -----------------------------
    //       REVOKE CERTIFICATE
    // -----------------------------

    function revokeCertificate(uint256 certId) external onlyInstitution {
        Certificate storage cert = certificates[certId];

        require(cert.id != 0, "Certificate does not exist");
        require(cert.institution == msg.sender, "Only issuing institution can revoke");

        cert.isValid = false;

        emit CertificateRevoked(certId);
    }
}
