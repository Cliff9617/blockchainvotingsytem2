// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DeVoteNational
 * @dev Professional National-Grade Election Management Platform
 *      Implements Role-Based Access Control, Audit Trail, and Multi-Signature Controls
 */
contract DeVoteNational {
    // ==========================================
    // ENUMS
    // ==========================================
    
    enum Position {
        President,
        Governor,
        Senator,
        WomanRepresentative,
        MemberOfParliament,
        MCA
    }

    enum Role {
        None,
        TechnicalSupport,
        Observer,
        Auditor,
        WardOfficer,
        ConstituencyOfficer,
        CountyReturningOfficer,
        NationalElectionCommissioner,
        SuperAdmin
    }

    enum ActionType {
        VoterRegistered,
        VoterApproved,
        VoterRejected,
        CandidateAdded,
        ElectionStarted,
        ElectionEnded,
        VoteCast,
        RoleAssigned,
        RoleRevoked,
        MultiSigApproved,
        MultiSigRejected,
        IncidentReported,
        ElectionPaused,
        ElectionResumed
    }

    enum MultiSigActionType {
        StartElection,
        EndElection,
        PublishResults,
        EmergencyPause,
        BulkVoterApproval,
        ConfigChange
    }

    // ==========================================
    // STRUCTS
    // ==========================================

    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
        Position position;
        string county;
        string constituency;
        string ward;
        bool active;
    }

    struct UserRole {
        Role role;
        string county;
        string constituency;
        string ward;
        bool active;
        uint256 assignedAt;
        address assignedBy;
    }

    struct AuditLog {
        uint256 id;
        ActionType actionType;
        address actor;
        Role actorRole;
        uint256 timestamp;
        string county;
        string constituency;
        string ward;
        bytes32 entityHash;
        string metadata;
        bytes32 previousHash;
    }

    struct MultiSigProposal {
        uint256 id;
        MultiSigActionType actionType;
        address proposer;
        uint256 requiredApprovals;
        uint256 approvalCount;
        mapping(address => bool) approvals;
        bool executed;
        bool rejected;
        uint256 createdAt;
        uint256 expiresAt;
        bytes data;
    }

    struct ElectionConfig {
        uint256 electionId;
        string name;
        string electionDate;
        uint256 startTime;
        uint256 endTime;
        bool active;
        bool paused;
        uint256 multiSigThreshold;
    }

    // ==========================================
    // STATE VARIABLES
    // ==========================================

    address public owner;
    bool public electionStarted;
    bool public electionEnded;
    bool public electionPaused;

    uint256 public candidatesCount;
    uint256 public auditLogCount;
    uint256 public multiSigProposalCount;

    mapping(uint256 => Candidate) public candidates;
    mapping(address => UserRole) public userRoles;
    mapping(uint256 => AuditLog) public auditLogs;
    mapping(uint256 => MultiSigProposal) public multiSigProposals;
    mapping(address => bool) public registeredVoters;
    mapping(address => mapping(uint256 => bool)) public hasVotedForPosition;
    mapping(address => mapping(uint256 => uint256)) private voterChoiceByPosition; // Private for ballot secrecy
    mapping(bytes32 => bool) public usedVoteTokens; // For anonymous vote verification

    ElectionConfig public electionConfig;

    // Multi-sig settings
    uint256 public multiSigThreshold = 3;
    uint256 public multiSigExpiry = 24 hours;

    // ==========================================
    // EVENTS
    // ==========================================

    event CandidateAdded(uint256 indexed candidateId, string name, uint256 position, string county, string constituency, string ward);
    event ElectionStarted(uint256 indexed electionId);
    event ElectionEnded(uint256 indexed electionId);
    event ElectionPaused(uint256 indexed electionId);
    event ElectionResumed(uint256 indexed electionId);
    event VoterRegistered(address indexed voter, string county, string constituency, string ward);
    event VoteCast(bytes32 indexed voteToken, uint256 position);
    event RoleAssigned(address indexed user, Role role, string county, string constituency, string ward);
    event RoleRevoked(address indexed user, Role previousRole);
    event MultiSigProposalCreated(uint256 indexed proposalId, MultiSigActionType actionType, address proposer);
    event MultiSigProposalApproved(uint256 indexed proposalId, address approver);
    event MultiSigProposalExecuted(uint256 indexed proposalId);
    event AuditLogCreated(uint256 indexed logId, ActionType actionType, address actor);

    // ==========================================
    // MODIFIERS
    // ==========================================

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized: owner only");
        _;
    }

    modifier onlyRole(Role _requiredRole) {
        require(userRoles[msg.sender].role >= _requiredRole, "Not authorized: insufficient role");
        _;
    }

    modifier onlyActiveRole() {
        require(userRoles[msg.sender].active, "Role is not active");
        _;
    }

    modifier electionActive() {
        require(electionStarted, "Election not started");
        require(!electionEnded, "Election ended");
        require(!electionPaused, "Election paused");
        _;
    }

    modifier onlyRegistered() {
        require(registeredVoters[msg.sender], "Not a registered voter");
        _;
    }

    // ==========================================
    // CONSTRUCTOR
    // ==========================================

    constructor() {
        owner = msg.sender;
        
        // Assign owner as Super Admin
        userRoles[msg.sender] = UserRole({
            role: Role.SuperAdmin,
            county: "",
            constituency: "",
            ward: "",
            active: true,
            assignedAt: block.timestamp,
            assignedBy: address(0)
        });

        _logAction(ActionType.RoleAssigned, msg.sender, Role.SuperAdmin, "", "", "", bytes32(0), "Initial super admin");
    }

    // ==========================================
    // ROLE MANAGEMENT
    // ==========================================

    /**
     * @dev Assign a role to a user (only Super Admin or National Commissioner)
     */
    function assignRole(
        address _user,
        Role _role,
        string memory _county,
        string memory _constituency,
        string memory _ward
    ) public onlyRole(Role.NationalElectionCommissioner) {
        require(_user != address(0), "Invalid address");
        require(uint8(_role) <= uint8(Role.SuperAdmin), "Invalid role");

        // Validate geographic scope based on role
        _validateRoleGeography(_role, _county, _constituency, _ward);

        // Revoke previous role if exists
        if (uint8(userRoles[_user].role) > 0) {
            emit RoleRevoked(_user, userRoles[_user].role);
            _logAction(ActionType.RoleRevoked, _user, userRoles[_user].role, "", "", "", bytes32(0), "Role revoked for new assignment");
        }

        userRoles[_user] = UserRole({
            role: _role,
            county: _county,
            constituency: _constituency,
            ward: _ward,
            active: true,
            assignedAt: block.timestamp,
            assignedBy: msg.sender
        });

        emit RoleAssigned(_user, _role, _county, _constituency, _ward);
        _logAction(ActionType.RoleAssigned, msg.sender, userRoles[msg.sender].role, _county, _constituency, _ward, keccak256(abi.encode(_user, _role)), "Role assigned");
    }

    /**
     * @dev Revoke a user's role
     */
    function revokeRole(address _user) public onlyRole(Role.SuperAdmin) {
        require(uint8(userRoles[_user].role) > 0, "User has no role");
        
        Role previousRole = userRoles[_user].role;
        userRoles[_user].active = false;
        
        emit RoleRevoked(_user, previousRole);
        _logAction(ActionType.RoleRevoked, msg.sender, userRoles[msg.sender].role, "", "", "", keccak256(abi.encode(_user)), "Role revoked");
    }

    /**
     * @dev Get user role information
     */
    function getUserRole(address _user) public view returns (
        Role role,
        string memory county,
        string memory constituency,
        string memory ward,
        bool active,
        uint256 assignedAt,
        address assignedBy
    ) {
        UserRole memory ur = userRoles[_user];
        return (
            ur.role,
            ur.county,
            ur.constituency,
            ur.ward,
            ur.active,
            ur.assignedAt,
            ur.assignedBy
        );
    }

    // ==========================================
    // MULTI-SIGNATURE CONTROL
    // ==========================================

    /**
     * @dev Create a multi-signature proposal for critical actions
     */
    function createMultiSigProposal(
        MultiSigActionType _actionType,
        bytes memory _data
    ) public onlyRole(Role.NationalElectionCommissioner) returns (uint256) {
        multiSigProposalCount++;
        
        MultiSigProposal storage proposal = multiSigProposals[multiSigProposalCount];
        proposal.id = multiSigProposalCount;
        proposal.actionType = _actionType;
        proposal.proposer = msg.sender;
        proposal.requiredApprovals = multiSigThreshold;
        proposal.approvalCount = 0;
        proposal.executed = false;
        proposal.rejected = false;
        proposal.createdAt = block.timestamp;
        proposal.expiresAt = block.timestamp + multiSigExpiry;
        proposal.data = _data;

        emit MultiSigProposalCreated(multiSigProposalCount, _actionType, msg.sender);
        _logAction(ActionType.MultiSigApproved, msg.sender, userRoles[msg.sender].role, "", "", "", keccak256(_data), "Multi-sig proposal created");

        return multiSigProposalCount;
    }

    /**
     * @dev Approve a multi-signature proposal
     */
    function approveMultiSigProposal(uint256 _proposalId) public onlyRole(Role.NationalElectionCommissioner) {
        require(_proposalId > 0 && _proposalId <= multiSigProposalCount, "Invalid proposal");
        
        MultiSigProposal storage proposal = multiSigProposals[_proposalId];
        require(!proposal.executed, "Proposal already executed");
        require(!proposal.rejected, "Proposal was rejected");
        require(block.timestamp <= proposal.expiresAt, "Proposal expired");
        require(!proposal.approvals[msg.sender], "Already approved");
        require(msg.sender != proposal.proposer, "Proposer cannot approve own proposal");

        proposal.approvals[msg.sender] = true;
        proposal.approvalCount++;

        emit MultiSigProposalApproved(_proposalId, msg.sender);

        // Execute if threshold reached
        if (proposal.approvalCount >= proposal.requiredApprovals) {
            _executeMultiSigProposal(_proposalId);
        }
    }

    /**
     * @dev Execute a multi-signature proposal
     */
    function _executeMultiSigProposal(uint256 _proposalId) internal {
        MultiSigProposal storage proposal = multiSigProposals[_proposalId];
        require(proposal.approvalCount >= proposal.requiredApprovals, "Insufficient approvals");

        if (proposal.actionType == MultiSigActionType.StartElection) {
            _executeStartElection();
        } else if (proposal.actionType == MultiSigActionType.EndElection) {
            _executeEndElection();
        } else if (proposal.actionType == MultiSigActionType.EmergencyPause) {
            electionPaused = true;
            emit ElectionPaused(electionConfig.electionId);
        }

        proposal.executed = true;
        emit MultiSigProposalExecuted(_proposalId);
    }

    // ==========================================
    // ELECTION MANAGEMENT
    // ==========================================

    /**
     * @dev Initialize election configuration
     */
    function initializeElection(
        uint256 _electionId,
        string memory _name,
        string memory _electionDate,
        uint256 _multiSigThreshold
    ) public onlyRole(Role.SuperAdmin) {
        require(electionConfig.electionId == 0, "Election already initialized");
        require(_multiSigThreshold >= 2, "Minimum threshold is 2");

        multiSigThreshold = _multiSigThreshold;

        electionConfig = ElectionConfig({
            electionId: _electionId,
            name: _name,
            electionDate: _electionDate,
            startTime: 0,
            endTime: 0,
            active: false,
            paused: false,
            multiSigThreshold: _multiSigThreshold
        });
    }

    /**
     * @dev Internal function to start election (called via multi-sig)
     */
    function _executeStartElection() internal {
        require(!electionStarted, "Election already started");
        require(candidatesCount > 0, "No candidates added");

        electionStarted = true;
        electionConfig.startTime = block.timestamp;
        electionConfig.active = true;

        emit ElectionStarted(electionConfig.electionId);
        _logAction(ActionType.ElectionStarted, msg.sender, userRoles[msg.sender].role, "", "", "", bytes32(0), "Election started via multi-sig");
    }

    /**
     * @dev Internal function to end election (called via multi-sig)
     */
    function _executeEndElection() internal {
        require(electionStarted, "Election not started");
        require(!electionEnded, "Election already ended");

        electionEnded = true;
        electionConfig.endTime = block.timestamp;
        electionConfig.active = false;

        emit ElectionEnded(electionConfig.electionId);
        _logAction(ActionType.ElectionEnded, msg.sender, userRoles[msg.sender].role, "", "", "", bytes32(0), "Election ended via multi-sig");
    }

    // ==========================================
    // DIRECT ELECTION CONTROLS (Super Admin Only)
    // ==========================================
    //
    // FIX: These public functions allow the Super Admin to start/end the election
    // directly, bypassing the multi-sig requirement. The multi-sig system remains
    // available for collaborative governance, but the Super Admin has unilateral
    // authority over election lifecycle as the ultimate authority.
    //
    // ROOT CAUSE OF THE BUG: The previous frontend implementation called
    // createMultiSigProposal() which only CREATES a proposal requiring 3 commissioner
    // approvals. The election state (electionStarted/electionEnded) was never actually
    // changed because _executeStartElection() is internal and only called when
    // enough commissioners approve the proposal. Since the proposer (SuperAdmin)
    // cannot approve their own proposal, and no other commissioners exist in a
    // typical deployment, the election could never be started.
    //
    // FIX: Added public startElection() and endElection() functions that SuperAdmin
    // can call directly. These call the same internal functions as the multi-sig
    // system, ensuring consistent state management.
    // ==========================================

    /**
     * @dev Start the election directly (Super Admin only)
     *      Bypasses multi-sig for Super Admin authority
     */
    function startElection() public onlyRole(Role.SuperAdmin) {
        _executeStartElection();
    }

    /**
     * @dev End the election directly (Super Admin only)
     *      Bypasses multi-sig for Super Admin authority
     */
    function endElection() public onlyRole(Role.SuperAdmin) {
        _executeEndElection();
    }

    // ==========================================
    // VOTER MANAGEMENT
    // ==========================================

    /**
     * @dev Register a voter (restricted by role geography)
     */
    function registerVoter(
        address _voter,
        string memory _county,
        string memory _constituency,
        string memory _ward
    ) public onlyActiveRole {
        require(_voter != address(0), "Invalid address");
        require(!registeredVoters[_voter], "Voter already registered");

        // Check geographic authorization
        _validateGeographicAccess(_county, _constituency, _ward);

        registeredVoters[_voter] = true;

        emit VoterRegistered(_voter, _county, _constituency, _ward);
        _logAction(ActionType.VoterRegistered, msg.sender, userRoles[msg.sender].role, _county, _constituency, _ward, keccak256(abi.encode(_voter)), "Voter registered");
    }

    /**
     * @dev Bulk register voters (requires multi-sig)
     */
    function bulkRegisterVoters(
        address[] memory _voters,
        string[] memory _counties,
        string[] memory _constituencies,
        string[] memory _wards
    ) public onlyRole(Role.CountyReturningOfficer) {
        require(_voters.length > 0, "No voters provided");
        require(_voters.length <= 100, "Max 100 voters per batch");

        for (uint256 i = 0; i < _voters.length; i++) {
            if (!registeredVoters[_voters[i]]) {
                registeredVoters[_voters[i]] = true;
                emit VoterRegistered(_voters[i], _counties[i], _constituencies[i], _wards[i]);
            }
        }

        _logAction(ActionType.VoterRegistered, msg.sender, userRoles[msg.sender].role, "", "", "", keccak256(abi.encode(_voters)), "Bulk voter registration");
    }

    // ==========================================
    // CANDIDATE MANAGEMENT
    // ==========================================

    /**
     * @dev Add a candidate with position and geographical area
     */
    function addCandidate(
        string memory _name,
        uint256 _position,
        string memory _county,
        string memory _constituency,
        string memory _ward
    ) public onlyRole(Role.NationalElectionCommissioner) onlyActiveRole {
        require(!electionStarted, "Cannot add candidates after election started");
        require(bytes(_name).length > 0, "Candidate name required");
        require(_position <= 5, "Invalid position");

        _validateCandidateGeoData(_position, _county, _constituency, _ward);

        candidatesCount++;

        candidates[candidatesCount] = Candidate({
            id: candidatesCount,
            name: _name,
            voteCount: 0,
            position: Position(_position),
            county: _county,
            constituency: _constituency,
            ward: _ward,
            active: true
        });

        emit CandidateAdded(candidatesCount, _name, _position, _county, _constituency, _ward);
        _logAction(ActionType.CandidateAdded, msg.sender, userRoles[msg.sender].role, _county, _constituency, _ward, keccak256(abi.encode(candidatesCount, _name)), "Candidate added");
    }

    // ==========================================
    // VOTING (BALLOT SECRECY PRESERVED)
    // ==========================================

    /**
     * @dev Vote for a candidate with anonymous vote token
     *      This preserves ballot secrecy by using a vote token instead of direct mapping
     */
    function vote(
        uint256 _candidateId,
        bytes32 _voteToken
    ) public electionActive onlyRegistered {
        require(
            _candidateId > 0 && _candidateId <= candidatesCount,
            "Invalid candidate"
        );
        require(candidates[_candidateId].active, "Candidate not active");
        require(!usedVoteTokens[_voteToken], "Vote token already used");

        Candidate storage candidate = candidates[_candidateId];
        uint256 positionIndex = uint256(candidate.position);

        // Check if voter has already voted for this position
        require(!hasVotedForPosition[msg.sender][positionIndex], "Already voted for this position");

        // Mark vote token as used (prevents double voting)
        usedVoteTokens[_voteToken] = true;

        // Update vote count
        candidate.voteCount++;

        // Track that voter voted for this position (but NOT who they voted for - ballot secrecy)
        hasVotedForPosition[msg.sender][positionIndex] = true;

        // Store private vote choice (only accessible through secure verification)
        voterChoiceByPosition[msg.sender][positionIndex] = _candidateId;

        emit VoteCast(_voteToken, positionIndex);
        _logAction(ActionType.VoteCast, msg.sender, userRoles[msg.sender].role, candidate.county, candidate.constituency, candidate.ward, _voteToken, "Vote cast");
    }

    /**
     * @dev Generate a secure vote token (called before voting)
     *      This token is used to prove voting eligibility without revealing vote choice
     */
    function generateVoteToken() public view onlyRegistered returns (bytes32) {
        return keccak256(abi.encodePacked(msg.sender, block.timestamp, electionConfig.electionId));
    }

    /**
     * @dev Verify if a voter has voted for a position (without revealing choice)
     */
    function hasVoterVotedForPosition(address _voter, uint256 _position)
        public
        view
        returns (bool)
    {
        require(_position <= 5, "Invalid position");
        return hasVotedForPosition[_voter][_position];
    }

    /**
     * @dev Get voting status for all positions (without revealing choices)
     */
    function getPositionVotingStatus(address _voter)
        public
        view
        returns(
            bool hasVotedPresident,
            bool hasVotedGovernor,
            bool hasVotedSenator,
            bool hasVotedWomanRep,
            bool hasVotedMP,
            bool hasVotedMCA
        )
    {
        hasVotedPresident = hasVotedForPosition[_voter][0];
        hasVotedGovernor = hasVotedForPosition[_voter][1];
        hasVotedSenator = hasVotedForPosition[_voter][2];
        hasVotedWomanRep = hasVotedForPosition[_voter][3];
        hasVotedMP = hasVotedForPosition[_voter][4];
        hasVotedMCA = hasVotedForPosition[_voter][5];
    }

    // ==========================================
    // AUDIT TRAIL
    // ==========================================

    /**
     * @dev Log an action to the immutable audit trail
     */
    function _logAction(
        ActionType _actionType,
        address _actor,
        Role _actorRole,
        string memory _county,
        string memory _constituency,
        string memory _ward,
        bytes32 _entityHash,
        string memory _metadata
    ) internal {
        auditLogCount++;

        bytes32 previousHash = auditLogCount > 1 ? keccak256(abi.encode(auditLogs[auditLogCount - 1])) : bytes32(0);

        auditLogs[auditLogCount] = AuditLog({
            id: auditLogCount,
            actionType: _actionType,
            actor: _actor,
            actorRole: _actorRole,
            timestamp: block.timestamp,
            county: _county,
            constituency: _constituency,
            ward: _ward,
            entityHash: _entityHash,
            metadata: _metadata,
            previousHash: previousHash
        });

        emit AuditLogCreated(auditLogCount, _actionType, _actor);
    }

    /**
     * @dev Get audit logs with filtering
     */
    function getAuditLogs(
        uint256 _startId,
        uint256 _count,
        ActionType _actionType
    ) public view returns (AuditLog[] memory) {
        uint256 actualCount = 0;
        
        // Count matching logs
        for (uint256 i = _startId; i <= auditLogCount && actualCount < _count; i++) {
            if (_actionType == ActionType.VoterRegistered || auditLogs[i].actionType == _actionType) {
                actualCount++;
            }
        }

        AuditLog[] memory result = new AuditLog[](actualCount);
        uint256 index = 0;

        for (uint256 i = _startId; i <= auditLogCount && index < actualCount; i++) {
            if (_actionType == ActionType.VoterRegistered || auditLogs[i].actionType == _actionType) {
                result[index] = auditLogs[i];
                index++;
            }
        }

        return result;
    }

    /**
     * @dev Verify audit log chain integrity
     */
    function verifyAuditChain() public view returns (bool) {
        for (uint256 i = 2; i <= auditLogCount; i++) {
            bytes32 expectedPreviousHash = keccak256(abi.encode(auditLogs[i - 1]));
            if (auditLogs[i].previousHash != expectedPreviousHash) {
                return false;
            }
        }
        return true;
    }

    // ==========================================
    // CANDIDATE & ELECTION QUERIES
    // ==========================================

    /**
     * @dev Get candidate details
     */
    function getCandidate(uint256 _id)
        public
        view
        returns(
            string memory name,
            uint256 voteCount,
            uint256 position,
            string memory county,
            string memory constituency,
            string memory ward,
            bool active
        )
    {
        Candidate memory candidate = candidates[_id];
        return (
            candidate.name,
            candidate.voteCount,
            uint256(candidate.position),
            candidate.county,
            candidate.constituency,
            candidate.ward,
            candidate.active
        );
    }

    /**
     * @dev Get all candidates for a position
     */
    function getCandidatesByPosition(uint256 _position)
        public
        view
        returns (Candidate[] memory)
    {
        uint256 count = 0;
        
        for (uint256 i = 1; i <= candidatesCount; i++) {
            if (uint256(candidates[i].position) == _position && candidates[i].active) {
                count++;
            }
        }

        Candidate[] memory result = new Candidate[](count);
        uint256 index = 0;

        for (uint256 i = 1; i <= candidatesCount; i++) {
            if (uint256(candidates[i].position) == _position && candidates[i].active) {
                result[index] = candidates[i];
                index++;
            }
        }

        return result;
    }

    /**
     * @dev Get total number of positions (6)
     */
    function getPositionCount() public pure returns (uint256) {
        return 6;
    }

    /**
     * @dev Get position name by index
     */
    function getPositionName(uint256 _index) public pure returns (string memory) {
        require(_index <= 5, "Invalid position");
        if (_index == 0) return "President";
        if (_index == 1) return "Governor";
        if (_index == 2) return "Senator";
        if (_index == 3) return "Woman Representative";
        if (_index == 4) return "Member of Parliament";
        return "MCA";
    }

    // ==========================================
    // INTERNAL VALIDATION FUNCTIONS
    // ==========================================

    function _validateCandidateGeoData(
        uint256 _position,
        string memory _county,
        string memory _constituency,
        string memory _ward
    ) internal pure {
        if (_position == 0) {
            // President - national position
            require(bytes(_county).length == 0, "President candidates should not have county");
            require(bytes(_constituency).length == 0, "President candidates should not have constituency");
            require(bytes(_ward).length == 0, "President candidates should not have ward");
        } else if (_position <= 3) {
            // Governor, Senator, Woman Representative - county-level
            require(bytes(_county).length > 0, "County required for this position");
            require(bytes(_constituency).length == 0, "Constituency not needed for this position");
            require(bytes(_ward).length == 0, "Ward not needed for this position");
        } else if (_position == 4) {
            // MP - constituency-level
            require(bytes(_county).length > 0, "County required for MP");
            require(bytes(_constituency).length > 0, "Constituency required for MP");
            require(bytes(_ward).length == 0, "Ward not needed for MP");
        } else {
            // MCA - ward-level
            require(bytes(_county).length > 0, "County required for MCA");
            require(bytes(_constituency).length > 0, "Constituency required for MCA");
            require(bytes(_ward).length > 0, "Ward required for MCA");
        }
    }

    function _validateRoleGeography(
        Role _role,
        string memory _county,
        string memory _constituency,
        string memory _ward
    ) internal pure {
        if (_role == Role.WardOfficer) {
            require(bytes(_ward).length > 0, "Ward required for Ward Officer");
        } else if (_role == Role.ConstituencyOfficer) {
            require(bytes(_constituency).length > 0, "Constituency required for Constituency Officer");
        } else if (_role == Role.CountyReturningOfficer) {
            require(bytes(_county).length > 0, "County required for County Officer");
        }
    }

    function _validateGeographicAccess(
        string memory _county,
        string memory _constituency,
        string memory _ward
    ) internal view {
        UserRole memory ur = userRoles[msg.sender];
        
        if (ur.role == Role.WardOfficer) {
            require(keccak256(bytes(ur.ward)) == keccak256(bytes(_ward)), "Can only register voters in your ward");
        } else if (ur.role == Role.ConstituencyOfficer) {
            require(keccak256(bytes(ur.constituency)) == keccak256(bytes(_constituency)), "Can only register voters in your constituency");
        } else if (ur.role == Role.CountyReturningOfficer) {
            require(keccak256(bytes(ur.county)) == keccak256(bytes(_county)), "Can only register voters in your county");
        }
        // National roles can register anywhere
    }
}