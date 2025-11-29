// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title FileAccessControl
 * @dev Smart contract for managing file access permissions and audit logs
 */
contract FileAccessControl is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    // Counter for unique access log IDs
    Counters.Counter private _accessLogIds;
    
    // Enums
    enum UserRole { Student, Lecturer, Administrator }
    enum PermissionType { Read, Write, Share }
    enum AccessAction { Upload, Download, View, Share, Revoke, Delete }
    
    // Structs
    struct FileMetadata {
        string ipfsHash;
        string fileName;
        uint256 fileSize;
        address owner;
        uint256 createdAt;
        bool exists;
    }
    
    struct Permission {
        address user;
        PermissionType permissionType;
        address grantedBy;
        uint256 grantedAt;
        bool isActive;
    }
    
    struct AccessLog {
        uint256 id;
        string fileId;
        address user;
        AccessAction action;
        uint256 timestamp;
        string ipAddress;
        string userAgent;
    }
    
    struct User {
        address userAddress;
        UserRole role;
        string email;
        string name;
        bool isRegistered;
    }
    
    // State variables
    mapping(string => FileMetadata) public files;
    mapping(string => mapping(address => Permission)) public filePermissions;
    mapping(string => address[]) public fileUserList; // Track users with permissions for each file
    mapping(address => User) public users;
    mapping(uint256 => AccessLog) public accessLogs;
    mapping(string => bool) public fileExists;
    
    address[] public registeredUsers;
    string[] public allFileIds;
    
    // Events
    event UserRegistered(address indexed userAddress, UserRole role, string email, string name);
    event FileUploaded(string indexed fileId, string ipfsHash, address indexed owner, string fileName, uint256 fileSize);
    event PermissionGranted(string indexed fileId, address indexed user, PermissionType permissionType, address indexed grantedBy);
    event PermissionRevoked(string indexed fileId, address indexed user, address indexed revokedBy);
    event AccessLogged(uint256 indexed logId, string indexed fileId, address indexed user, AccessAction action, uint256 timestamp);
    event FileDeleted(string indexed fileId, address indexed owner);
    
    // Modifiers
    modifier onlyRegisteredUser() {
        require(users[msg.sender].isRegistered, "User not registered");
        _;
    }
    
    modifier onlyFileOwner(string memory fileId) {
        require(files[fileId].owner == msg.sender, "Only file owner can perform this action");
        _;
    }
    
    modifier fileExistsModifier(string memory fileId) {
        require(fileExists[fileId], "File does not exist");
        _;
    }
    
    modifier hasPermission(string memory fileId, PermissionType requiredPermission) {
        require(
            files[fileId].owner == msg.sender || 
            (filePermissions[fileId][msg.sender].isActive && 
             uint8(filePermissions[fileId][msg.sender].permissionType) >= uint8(requiredPermission)),
            "Insufficient permissions"
        );
        _;
    }
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Register a new user
     */
    function registerUser(
        address userAddress,
        UserRole role,
        string memory email,
        string memory name
    ) external onlyOwner {
        require(!users[userAddress].isRegistered, "User already registered");
        
        users[userAddress] = User({
            userAddress: userAddress,
            role: role,
            email: email,
            name: name,
            isRegistered: true
        });
        
        registeredUsers.push(userAddress);
        
        emit UserRegistered(userAddress, role, email, name);
    }
    
    /**
     * @dev Upload a new file
     */
    function uploadFile(
        string memory fileId,
        string memory ipfsHash,
        string memory fileName,
        uint256 fileSize
    ) external onlyRegisteredUser nonReentrant {
        require(!fileExists[fileId], "File already exists");
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(fileName).length > 0, "File name cannot be empty");
        require(fileSize > 0, "File size must be greater than 0");
        
        files[fileId] = FileMetadata({
            ipfsHash: ipfsHash,
            fileName: fileName,
            fileSize: fileSize,
            owner: msg.sender,
            createdAt: block.timestamp,
            exists: true
        });
        
        fileExists[fileId] = true;
        allFileIds.push(fileId);
        
        // Log the upload action
        _logAccess(fileId, msg.sender, AccessAction.Upload, "", "");
        
        emit FileUploaded(fileId, ipfsHash, msg.sender, fileName, fileSize);
    }
    
    /**
     * @dev Grant permission to a user for a file
     */
    function grantPermission(
        string memory fileId,
        address user,
        PermissionType permissionType
    ) external fileExistsModifier(fileId) onlyRegisteredUser nonReentrant {
        require(
            files[fileId].owner == msg.sender || 
            users[msg.sender].role == UserRole.Administrator,
            "Only file owner or administrator can grant permissions"
        );
        require(users[user].isRegistered, "Target user not registered");
        require(user != files[fileId].owner, "Cannot grant permission to file owner");
        
        // Check if user already has permission
        if (!filePermissions[fileId][user].isActive) {
            fileUserList[fileId].push(user);
        }
        
        filePermissions[fileId][user] = Permission({
            user: user,
            permissionType: permissionType,
            grantedBy: msg.sender,
            grantedAt: block.timestamp,
            isActive: true
        });
        
        // Log the share action
        _logAccess(fileId, msg.sender, AccessAction.Share, "", "");
        
        emit PermissionGranted(fileId, user, permissionType, msg.sender);
    }
    
    /**
     * @dev Revoke permission from a user for a file
     */
    function revokePermission(
        string memory fileId,
        address user
    ) external fileExistsModifier(fileId) onlyRegisteredUser nonReentrant {
        require(
            files[fileId].owner == msg.sender || 
            users[msg.sender].role == UserRole.Administrator,
            "Only file owner or administrator can revoke permissions"
        );
        require(filePermissions[fileId][user].isActive, "User does not have active permission");
        
        filePermissions[fileId][user].isActive = false;
        
        // Log the revoke action
        _logAccess(fileId, msg.sender, AccessAction.Revoke, "", "");
        
        emit PermissionRevoked(fileId, user, msg.sender);
    }
    
    /**
     * @dev Log file access
     */
    function logFileAccess(
        string memory fileId,
        AccessAction action,
        string memory ipAddress,
        string memory userAgent
    ) external fileExistsModifier(fileId) onlyRegisteredUser {
        require(
            action == AccessAction.Download || 
            action == AccessAction.View,
            "Invalid action for external logging"
        );
        
        // Check if user has permission to access the file
        require(
            files[fileId].owner == msg.sender || 
            filePermissions[fileId][msg.sender].isActive,
            "No permission to access this file"
        );
        
        _logAccess(fileId, msg.sender, action, ipAddress, userAgent);
    }
    
    /**
     * @dev Internal function to log access
     */
    function _logAccess(
        string memory fileId,
        address user,
        AccessAction action,
        string memory ipAddress,
        string memory userAgent
    ) internal {
        _accessLogIds.increment();
        uint256 logId = _accessLogIds.current();
        
        accessLogs[logId] = AccessLog({
            id: logId,
            fileId: fileId,
            user: user,
            action: action,
            timestamp: block.timestamp,
            ipAddress: ipAddress,
            userAgent: userAgent
        });
        
        emit AccessLogged(logId, fileId, user, action, block.timestamp);
    }
    
    /**
     * @dev Delete a file (only owner or administrator)
     */
    function deleteFile(string memory fileId) 
        external 
        fileExistsModifier(fileId) 
        onlyRegisteredUser 
        nonReentrant 
    {
        require(
            files[fileId].owner == msg.sender || 
            users[msg.sender].role == UserRole.Administrator,
            "Only file owner or administrator can delete file"
        );
        
        // Log the delete action
        _logAccess(fileId, msg.sender, AccessAction.Delete, "", "");
        
        delete files[fileId];
        fileExists[fileId] = false;
        
        // Clear all permissions for this file
        address[] memory usersWithPermission = fileUserList[fileId];
        for (uint256 i = 0; i < usersWithPermission.length; i++) {
            delete filePermissions[fileId][usersWithPermission[i]];
        }
        delete fileUserList[fileId];
        
        emit FileDeleted(fileId, msg.sender);
    }
    
    /**
     * @dev Get file metadata
     */
    function getFileMetadata(string memory fileId) 
        external 
        view 
        fileExistsModifier(fileId)
        returns (
            string memory ipfsHash,
            string memory fileName,
            uint256 fileSize,
            address owner,
            uint256 createdAt
        ) 
    {
        FileMetadata memory file = files[fileId];
        return (file.ipfsHash, file.fileName, file.fileSize, file.owner, file.createdAt);
    }
    
    /**
     * @dev Check if user has permission for a file
     */
    function hasFilePermission(string memory fileId, address user, PermissionType requiredPermission) 
        external 
        view 
        returns (bool) 
    {
        if (files[fileId].owner == user) {
            return true;
        }
        
        Permission memory permission = filePermissions[fileId][user];
        return permission.isActive && uint8(permission.permissionType) >= uint8(requiredPermission);
    }
    
    /**
     * @dev Get all files owned by a user
     */
    function getUserFiles(address user) external view returns (string[] memory) {
        string[] memory userFiles = new string[](allFileIds.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < allFileIds.length; i++) {
            if (files[allFileIds[i]].owner == user && fileExists[allFileIds[i]]) {
                userFiles[count] = allFileIds[i];
                count++;
            }
        }
        
        // Resize array to actual count
        string[] memory result = new string[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = userFiles[i];
        }
        
        return result;
    }
    
    /**
     * @dev Get all files accessible to a user
     */
    function getAccessibleFiles(address user) external view returns (string[] memory) {
        string[] memory accessibleFiles = new string[](allFileIds.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < allFileIds.length; i++) {
            string memory fileId = allFileIds[i];
            if (fileExists[fileId] && 
                (files[fileId].owner == user || filePermissions[fileId][user].isActive)) {
                accessibleFiles[count] = fileId;
                count++;
            }
        }
        
        // Resize array to actual count
        string[] memory result = new string[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = accessibleFiles[i];
        }
        
        return result;
    }
    
    /**
     * @dev Get access logs for a file
     */
    function getFileAccessLogs(string memory fileId) 
        external 
        view 
        fileExistsModifier(fileId)
        returns (AccessLog[] memory) 
    {
        // Count logs for this file
        uint256 count = 0;
        for (uint256 i = 1; i <= _accessLogIds.current(); i++) {
            if (keccak256(bytes(accessLogs[i].fileId)) == keccak256(bytes(fileId))) {
                count++;
            }
        }
        
        // Create result array
        AccessLog[] memory fileLogs = new AccessLog[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= _accessLogIds.current(); i++) {
            if (keccak256(bytes(accessLogs[i].fileId)) == keccak256(bytes(fileId))) {
                fileLogs[index] = accessLogs[i];
                index++;
            }
        }
        
        return fileLogs;
    }
    
    /**
     * @dev Get user information
     */
    function getUserInfo(address userAddress) 
        external 
        view 
        returns (
            UserRole role,
            string memory email,
            string memory name,
            bool isRegistered
        ) 
    {
        User memory user = users[userAddress];
        return (user.role, user.email, user.name, user.isRegistered);
    }
    
    /**
     * @dev Get total number of access logs
     */
    function getTotalAccessLogs() external view returns (uint256) {
        return _accessLogIds.current();
    }
    
    /**
     * @dev Get all registered users (only for administrators)
     */
    function getAllUsers() external view returns (address[] memory) {
        require(
            users[msg.sender].role == UserRole.Administrator || 
            msg.sender == owner(),
            "Only administrators can view all users"
        );
        return registeredUsers;
    }
    
    /**
     * @dev Update user role (only owner)
     */
    function updateUserRole(address userAddress, UserRole newRole) external onlyOwner {
        require(users[userAddress].isRegistered, "User not registered");
        users[userAddress].role = newRole;
    }
}

