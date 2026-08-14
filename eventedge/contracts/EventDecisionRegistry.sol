// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// @title EventDecisionRegistry
/// @author askstone
/// @notice Non-custodial attestations for human-approved askstone decisions powered by EventEdge Engine.
/// @dev The registry records hashes only. Execution and token approvals belong in a separate audited adapter.
contract EventDecisionRegistry {
    /// @notice Maximum accepted confidence score, expressed as an integer percentage.
    uint16 public constant MAX_CONFIDENCE = 100;
    /// @notice Keccak-256 of the canonical AskstoneDecisionReceipt type string documented in SECURITY.md.
    bytes32 public constant RECEIPT_TYPEHASH =
        0xbedd5bf628df674caf0f6a5b6abc1da394318ba876e5ec137eb5b752536d5bba;

    enum DecisionKind {
        Trade,
        Hedge,
        Wait
    }

    enum ReceiptStatus {
        None,
        Approved,
        Executed,
        Cancelled
    }

    struct Receipt {
        address owner;
        bytes32 eventHash;
        bytes32 planHash;
        bytes32 executionTxHash;
        uint64 createdAt;
        uint64 finalizedAt;
        uint64 createdBlock;
        uint16 confidence;
        DecisionKind kind;
        ReceiptStatus status;
    }

    error ReceiptAlreadyExists(bytes32 receiptId);
    error ReceiptNotFound(bytes32 receiptId);
    error NotReceiptOwner(address caller);
    error InvalidConfidence(uint16 confidence);
    error InvalidStatus(ReceiptStatus current);
    error EmptyHash();
    error InvalidOwner(address owner);

    mapping(bytes32 receiptId => Receipt receipt) private _receipts;

    /// @notice Emitted after an owner approves a new decision commitment.
    /// @param receiptId Domain-separated identifier of the immutable decision fields.
    /// @param owner Account that approved and controls the receipt.
    /// @param eventHash Commitment to the canonical event payload.
    /// @param planHash Commitment to the canonical decision-plan payload.
    /// @param kind Decision action category.
    /// @param confidence Integer confidence percentage from 0 through 100.
    /// @param createdAt Block timestamp at approval.
    /// @param createdBlock Block number at approval.
    event DecisionApproved(
        bytes32 indexed receiptId,
        address indexed owner,
        bytes32 indexed eventHash,
        bytes32 planHash,
        DecisionKind kind,
        uint16 confidence,
        uint64 createdAt,
        uint64 createdBlock
    );
    /// @notice Emitted when the owner finalizes an approved receipt as executed.
    /// @param receiptId Identifier of the finalized receipt.
    /// @param owner Account that owns and finalized the receipt.
    /// @param executionTxHash Owner-supplied commitment to the execution transaction.
    /// @param finalizedAt Block timestamp at finalization.
    event DecisionExecuted(
        bytes32 indexed receiptId,
        address indexed owner,
        bytes32 indexed executionTxHash,
        uint64 finalizedAt
    );
    /// @notice Emitted when the owner irreversibly cancels an approved receipt.
    /// @param receiptId Identifier of the finalized receipt.
    /// @param owner Account that owns and finalized the receipt.
    /// @param finalizedAt Block timestamp at finalization.
    event DecisionCancelled(bytes32 indexed receiptId, address indexed owner, uint64 finalizedAt);

    /// @notice Records a human-approved decision without transferring or approving assets.
    /// @param eventHash Commitment to a canonical, versioned event payload.
    /// @param planHash Commitment to a canonical, versioned decision-plan payload.
    /// @param kind Decision action category.
    /// @param confidence Integer confidence percentage from 0 through 100.
    /// @return receiptId Domain-separated identifier of the newly created receipt.
    function approveDecision(
        bytes32 eventHash,
        bytes32 planHash,
        DecisionKind kind,
        uint16 confidence
    ) external returns (bytes32 receiptId) {
        _validateDecision(eventHash, planHash, confidence);

        receiptId = _receiptIdFor(msg.sender, eventHash, planHash, kind, confidence);
        if (_receipts[receiptId].status != ReceiptStatus.None) {
            revert ReceiptAlreadyExists(receiptId);
        }

        uint64 createdAt = uint64(block.timestamp);
        uint64 createdBlock = uint64(block.number);

        _receipts[receiptId] = Receipt({
            owner: msg.sender,
            eventHash: eventHash,
            planHash: planHash,
            executionTxHash: bytes32(0),
            createdAt: createdAt,
            finalizedAt: 0,
            createdBlock: createdBlock,
            confidence: confidence,
            kind: kind,
            status: ReceiptStatus.Approved
        });

        emit DecisionApproved(
            receiptId,
            msg.sender,
            eventHash,
            planHash,
            kind,
            confidence,
            createdAt,
            createdBlock
        );
    }

    /// @notice Irreversibly finalizes an approved receipt as executed.
    /// @param receiptId Identifier of an approved receipt owned by the caller.
    /// @param executionTxHash Nonzero owner-supplied commitment to the execution transaction.
    function markExecuted(bytes32 receiptId, bytes32 executionTxHash) external {
        Receipt storage receipt = _receiptOwnedByCaller(receiptId);
        if (receipt.status != ReceiptStatus.Approved) revert InvalidStatus(receipt.status);
        if (executionTxHash == bytes32(0)) revert EmptyHash();

        uint64 finalizedAt = uint64(block.timestamp);
        receipt.executionTxHash = executionTxHash;
        receipt.finalizedAt = finalizedAt;
        receipt.status = ReceiptStatus.Executed;
        emit DecisionExecuted(receiptId, msg.sender, executionTxHash, finalizedAt);
    }

    /// @notice Irreversibly finalizes an approved receipt as cancelled.
    /// @param receiptId Identifier of an approved receipt owned by the caller.
    function cancelDecision(bytes32 receiptId) external {
        Receipt storage receipt = _receiptOwnedByCaller(receiptId);
        if (receipt.status != ReceiptStatus.Approved) revert InvalidStatus(receipt.status);

        uint64 finalizedAt = uint64(block.timestamp);
        receipt.finalizedAt = finalizedAt;
        receipt.status = ReceiptStatus.Cancelled;
        emit DecisionCancelled(receiptId, msg.sender, finalizedAt);
    }

    /// @notice Returns an existing receipt.
    /// @param receiptId Identifier to query.
    /// @return receipt Complete stored receipt.
    function getReceipt(bytes32 receiptId) external view returns (Receipt memory receipt) {
        receipt = _receipts[receiptId];
        if (receipt.status == ReceiptStatus.None) revert ReceiptNotFound(receiptId);
    }

    /// @notice Computes the exact receipt ID that approval would create for valid fields.
    /// @param owner Prospective nonzero receipt owner.
    /// @param eventHash Commitment to a canonical, versioned event payload.
    /// @param planHash Commitment to a canonical, versioned decision-plan payload.
    /// @param kind Decision action category.
    /// @param confidence Integer confidence percentage from 0 through 100.
    /// @return receiptId Domain-separated receipt identifier.
    function receiptIdFor(
        address owner,
        bytes32 eventHash,
        bytes32 planHash,
        DecisionKind kind,
        uint16 confidence
    ) external view returns (bytes32 receiptId) {
        if (owner == address(0)) revert InvalidOwner(owner);
        _validateDecision(eventHash, planHash, confidence);
        receiptId = _receiptIdFor(owner, eventHash, planHash, kind, confidence);
    }

    function _receiptIdFor(
        address owner,
        bytes32 eventHash,
        bytes32 planHash,
        DecisionKind kind,
        uint16 confidence
    ) private view returns (bytes32) {
        return keccak256(
            abi.encode(
                RECEIPT_TYPEHASH,
                block.chainid,
                address(this),
                owner,
                eventHash,
                planHash,
                kind,
                confidence
            )
        );
    }

    function _validateDecision(bytes32 eventHash, bytes32 planHash, uint16 confidence) private pure {
        if (eventHash == bytes32(0) || planHash == bytes32(0)) revert EmptyHash();
        if (confidence > MAX_CONFIDENCE) revert InvalidConfidence(confidence);
    }

    function _receiptOwnedByCaller(bytes32 receiptId) private view returns (Receipt storage receipt) {
        receipt = _receipts[receiptId];
        if (receipt.status == ReceiptStatus.None) revert ReceiptNotFound(receiptId);
        if (receipt.owner != msg.sender) revert NotReceiptOwner(msg.sender);
    }
}
