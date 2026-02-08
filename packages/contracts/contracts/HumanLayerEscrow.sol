// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract HumanLayerEscrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public usdcToken;
    uint256 public platformFeeBps = 250; // 2.5%
    bool public paused;

    enum EscrowStatus {
        Active,
        Released,
        Refunded,
        Disputed
    }

    struct Escrow {
        address buyer;
        address provider;
        uint256 amount;
        uint256 platformFee;
        uint256 deadline;
        EscrowStatus status;
    }

    mapping(bytes32 => Escrow) public escrows;

    event EscrowCreated(
        bytes32 indexed escrowId,
        address indexed buyer,
        address indexed provider,
        uint256 amount,
        string orderId
    );
    event EscrowReleased(
        bytes32 indexed escrowId,
        address indexed provider,
        uint256 amount,
        uint256 fee
    );
    event EscrowRefunded(
        bytes32 indexed escrowId,
        address indexed buyer,
        uint256 amount
    );
    event EscrowDisputed(
        bytes32 indexed escrowId,
        address indexed buyer
    );

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    constructor(address _usdcToken) Ownable(msg.sender) {
        usdcToken = IERC20(_usdcToken);
    }

    function deposit(
        address provider,
        string calldata orderId,
        uint256 amount,
        uint256 deadline
    ) external whenNotPaused nonReentrant returns (bytes32) {
        require(provider != address(0), "Invalid provider");
        require(amount > 0, "Amount must be > 0");
        require(deadline > block.timestamp, "Deadline must be in the future");

        uint256 fee = (amount * platformFeeBps) / 10000;

        bytes32 escrowId = keccak256(
            abi.encodePacked(msg.sender, provider, orderId, block.timestamp)
        );
        require(escrows[escrowId].buyer == address(0), "Escrow already exists");

        usdcToken.safeTransferFrom(msg.sender, address(this), amount);

        escrows[escrowId] = Escrow({
            buyer: msg.sender,
            provider: provider,
            amount: amount,
            platformFee: fee,
            deadline: deadline,
            status: EscrowStatus.Active
        });

        emit EscrowCreated(escrowId, msg.sender, provider, amount, orderId);
        return escrowId;
    }

    function release(bytes32 escrowId) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.Active, "Escrow not active");
        require(
            msg.sender == escrow.buyer || block.timestamp >= escrow.deadline,
            "Not authorized"
        );

        escrow.status = EscrowStatus.Released;

        uint256 providerAmount = escrow.amount - escrow.platformFee;
        usdcToken.safeTransfer(escrow.provider, providerAmount);
        if (escrow.platformFee > 0) {
            usdcToken.safeTransfer(owner(), escrow.platformFee);
        }

        emit EscrowReleased(
            escrowId,
            escrow.provider,
            providerAmount,
            escrow.platformFee
        );
    }

    function refund(bytes32 escrowId) external onlyOwner nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        require(
            escrow.status == EscrowStatus.Active ||
                escrow.status == EscrowStatus.Disputed,
            "Escrow not active or disputed"
        );

        escrow.status = EscrowStatus.Refunded;
        usdcToken.safeTransfer(escrow.buyer, escrow.amount);

        emit EscrowRefunded(escrowId, escrow.buyer, escrow.amount);
    }

    function dispute(bytes32 escrowId) external {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.Active, "Escrow not active");
        require(msg.sender == escrow.buyer, "Only buyer can dispute");

        escrow.status = EscrowStatus.Disputed;

        emit EscrowDisputed(escrowId, escrow.buyer);
    }

    function setPlatformFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 1000, "Fee too high"); // max 10%
        platformFeeBps = newFeeBps;
    }

    function pause() external onlyOwner {
        paused = true;
    }

    function unpause() external onlyOwner {
        paused = false;
    }

    function getEscrow(bytes32 escrowId) external view returns (Escrow memory) {
        return escrows[escrowId];
    }
}
