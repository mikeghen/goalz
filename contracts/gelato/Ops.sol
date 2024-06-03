pragma solidity ^0.8.0;

import { ModuleData } from "./Types.sol";

contract Ops {
    function exec(
        address _taskCreator,
        address _execAddress,
        bytes memory _execData,
        ModuleData calldata _moduleData,
        uint256 _txFee,
        address _feeToken,
        bool _revertOnFailure
    ) external {}
}
