// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract HumanLayerStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public usdcToken;
    uint256 public minimumStake;
    uint256 public cooldownPeriod = 7 days;

    struct Stake {
        uint256 amount;
        uint256 unstakeRequestedAt;
        bool active;
    }

    mapping(address => Stake) public stakes;

    event Staked(address indexed provider, uint256 amount);
    event UnstakeRequested(address indexed provider, uint256 timestamp);
    event Withdrawn(address indexed provider, uint256 amount);
    event Slashed(address indexed provider, uint256 amount);

    constructor(
        address _usdcToken,
        uint256 _minimumStake
    ) Ownable(msg.sender) {
        usdcToken = IERC20(_usdcToken);
        minimumStake = _minimumStake;
    }

    function stake(uint256 amount) external nonReentrant {
        require(amount >= minimumStake, "Below minimum stake");

        usdcToken.safeTransferFrom(msg.sender, address(this), amount);

        Stake storage s = stakes[msg.sender];
        s.amount += amount;
        s.active = true;
        s.unstakeRequestedAt = 0;

        emit Staked(msg.sender, amount);
    }

    function requestUnstake() external {
        Stake storage s = stakes[msg.sender];
        require(s.active, "No active stake");
        require(s.unstakeRequestedAt == 0, "Unstake already requested");

        s.unstakeRequestedAt = block.timestamp;

        emit UnstakeRequested(msg.sender, block.timestamp);
    }

    function withdraw() external nonReentrant {
        Stake storage s = stakes[msg.sender];
        require(s.active, "No active stake");
        require(s.unstakeRequestedAt > 0, "Unstake not requested");
        require(
            block.timestamp >= s.unstakeRequestedAt + cooldownPeriod,
            "Cooldown not elapsed"
        );

        uint256 amount = s.amount;
        s.amount = 0;
        s.active = false;
        s.unstakeRequestedAt = 0;

        usdcToken.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    function slash(address provider, uint256 amount) external onlyOwner {
        Stake storage s = stakes[provider];
        require(s.active, "No active stake");
        require(amount <= s.amount, "Slash exceeds stake");

        s.amount -= amount;
        if (s.amount == 0) {
            s.active = false;
        }

        usdcToken.safeTransfer(owner(), amount);

        emit Slashed(provider, amount);
    }

    function setMinimumStake(uint256 newMinimum) external onlyOwner {
        minimumStake = newMinimum;
    }

    function setCooldownPeriod(uint256 newPeriod) external onlyOwner {
        cooldownPeriod = newPeriod;
    }

    function getStake(address provider) external view returns (Stake memory) {
        return stakes[provider];
    }

    function isActiveProvider(address provider) external view returns (bool) {
        return stakes[provider].active;
    }
}
