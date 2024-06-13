import { BigNumber, ethers } from 'ethers';
import { GOALZ_ADDRESS, GOALZ_ABI, USDC_ADDRESS, ERC20_ABI } from '../config/constants';
import { useReadContract, useWriteContract } from 'wagmi';

export const getProvider = async () => {
    if (typeof (window as any).ethereum !== 'undefined') {
        return new ethers.providers.Web3Provider((window as any).ethereum as ethers.providers.ExternalProvider);
    }
    throw new Error('Ethereum provider not found.');
};
export const getSigner = async (provider: ethers.providers.Web3Provider) => {
    return provider.getSigner();
};

export const useContractApprove = () => {
    const { writeContractAsync } = useWriteContract()

    const approve = async (depositToken: string) => {
        const maxApprovalAmount = ethers.constants.MaxUint256;
        const res = await writeContractAsync({
            abi: ERC20_ABI,
            address: depositToken as any,
            functionName: "approve",
            args: [
                GOALZ_ADDRESS,
                maxApprovalAmount
            ]
        });
        return res;
    }
    return approve;
}
export const useContractAllowance = () => {

    const getAllowance = async (depositToken: string) => {
        const allowance = useReadContract({
            address: depositToken as any,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [GOALZ_ADDRESS],
        });
        return allowance;
    };

    return getAllowance;
};

export const useSetGoal = () => {
    const { writeContractAsync } = useWriteContract();

    const setGoal = async (depositToken: string, what: string, why: string, targetAmount: BigNumber, targetDate: BigNumber) => {
        const res = await writeContractAsync({
            abi: GOALZ_ABI,
            address: GOALZ_ADDRESS,
            functionName: "setGoal",
            args: [what, why, targetAmount, targetDate, depositToken]
        });
        return res;
    };

    return setGoal;
};

export const useDeleteGoal = () => {
    const { writeContractAsync } = useWriteContract();

    const deleteGoal = async (goalId: BigNumber) => {
        const res = await writeContractAsync({
            abi: GOALZ_ABI,
            address: GOALZ_ADDRESS,
            functionName: "deleteGoal",
            args: [goalId]
        });
        return res;
    };

    return deleteGoal;
};

export const deposit = async (goalId: BigNumber, amount: BigNumber) => {
    const { writeContractAsync } = useWriteContract();
    const res = await writeContractAsync({
        abi: GOALZ_ABI,
        address: GOALZ_ADDRESS,
        functionName: "deposit",
        args: [goalId, amount]
    });
    return res;
};

export const withdraw = async (goalId: BigNumber) => {
    const { writeContractAsync } = useWriteContract();
    const res = await writeContractAsync({
        abi: GOALZ_ABI,
        address: GOALZ_ADDRESS,
        functionName: "withdraw",
        args: [goalId]
    });
    return res;
};

export const useAutomateDeposit = () => {
    const { writeContractAsync } = useWriteContract();

    const automateDeposit = async (goalId: BigNumber, amount: BigNumber, frequency: BigNumber) => {
        const res = await writeContractAsync({
            abi: GOALZ_ABI,
            address: GOALZ_ADDRESS,
            functionName: "automateDeposit",
            args: [goalId, amount, frequency]
        });
        return res;
    };

    return automateDeposit;
};

export const useCancelAutomatedDeposit = () => {
    const { writeContractAsync } = useWriteContract();

    const cancelAutomatedDeposit = async (goalId: BigNumber) => {
        const res = await writeContractAsync({
            abi: GOALZ_ABI,
            address: GOALZ_ADDRESS,
            functionName: "cancelAutomatedDeposit",
            args: [goalId]
        });
        return res;
    };

    return cancelAutomatedDeposit;
};

export const useGetGoalData = () => {

    const getGoalData = async (goalId: BigNumber) => {
        const data = useReadContract({
            abi: GOALZ_ABI,
            address: GOALZ_ADDRESS,
            functionName: "savingsGoals",
            args: [goalId]
        });
        return data;
    };

    return getGoalData;
};

export const getEvents = async () => {
    const provider = await getProvider();
    const contract = new ethers.Contract(GOALZ_ADDRESS, GOALZ_ABI, provider);
    const eventName = 'DepositMade';
    let startBlock = await provider.getBlockNumber() - 100; //43200 * days; 
    const endBlock = await provider.getBlockNumber();
    const filter = contract.filters[eventName](); // Create a filter for the event
    const steps = parseInt(((endBlock - startBlock) / 1000).toString());
    const lastStepSize = (endBlock - startBlock) % 1000;
    let events: any[] = [];
    for (let i = 0; i < steps; i++) {
        console.log('step')
        const stepStartBlock = startBlock + i * 1000;
        const stepEndBlock = stepStartBlock + 1000;
        let eventSet = await contract.queryFilter(filter, stepStartBlock, stepEndBlock);
        events = events.concat(eventSet);
    }
    startBlock = endBlock - lastStepSize;
    let eventSet = await contract.queryFilter(filter, startBlock, endBlock);
    events = events.concat(eventSet);
    return events;
}



