// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockGelato {

    struct ModuleData {
        Module[] modules;
        bytes[] args;
    }

    enum Module {
        RESOLVER,
        TIME,
        PROXY,
        SINGLE_EXEC
    }

    function gelato() external view returns (address) {
        return address(this);
    }

    function taskTreasury() external pure returns (address) {
        return address(0);
    }

    function createTask(address, bytes calldata, ModuleData calldata, address) external pure returns (bytes32) {
        return bytes32("1");
    }

    function feeCollector() external pure returns (address) {
        return address(0);
    }

    function taskModuleAddresses(Module) external view returns (address) {
        return address(this);
    }

    function opsProxyFactory() external view returns (address) {
        return address(this);
    }

    function getProxyOf(address) external view returns (address, bool) {
        return (address(this), true);
    }

    function getFeeDetails() external pure returns (uint256, address) {
        return (0, address(0));
    }

    function cancelTask(bytes32) external pure {
    }

}
