import { BigNumber, ethers } from 'ethers';
import { GOALZ_ADDRESS, GOALZ_ABI } from '../config/constants'; 

// Methods for executing transaction on Ethereum 

export const getProvider = () => {
    if (typeof window.ethereum !== 'undefined') {
        return new ethers.providers.Web3Provider(window.ethereum);
    }
    throw new Error('Ethereum provider not found.');
};

export const getSigner = (provider: ethers.providers.Web3Provider) => {
    return provider.getSigner();
};

export const approveTokens = async (contractAddress: string, spenderAddress: string) => {
    const provider = await getProvider();
    const signer = await getSigner(provider);
    const contract = new ethers.Contract(
        contractAddress,
        ['function approve(address spender, uint256 amount) external returns (bool)'],
        signer
    );

    // TODO: No max approval
    const maxApprovalAmount = ethers.constants.MaxUint256;
    const approvalTx = await contract.approve(spenderAddress, maxApprovalAmount);
    await approvalTx.wait();
};

export const setGoal = async (what: string, why: string, targetAmount: BigNumber, targetDate: BigNumber) => {
    const provider = await getProvider();
    const signer = await getSigner(provider);
    const goalz = new ethers.Contract(
        GOALZ_ADDRESS,
        GOALZ_ABI,
        signer
    );
    const goalTx = await goalz.setGoal(what, why, targetAmount, targetDate);
    await goalTx.wait();
};

export const deleteGoal = async (goalId: BigNumber) => {
    const provider = await getProvider();
    const signer = await getSigner(provider);
    const goalz = new ethers.Contract(
        GOALZ_ADDRESS,
        GOALZ_ABI,
        signer
    );
    const deleteGoalTx = await goalz.deleteGoal(goalId);
    await deleteGoalTx.wait();
};

export const deposit = async (goalId: BigNumber, amount: BigNumber) => {
    const provider = await getProvider();
    const signer = await getSigner(provider);
    const goalz = new ethers.Contract(
        GOALZ_ADDRESS,
        GOALZ_ABI,
        signer
    );
    const depositTx = await goalz.deposit(goalId, amount);
    await depositTx.wait();
};

export const withdraw = async (goalId: BigNumber) => {
    const provider = await getProvider();
    const signer = await getSigner(provider);
    const goalz = new ethers.Contract(
        GOALZ_ADDRESS,
        GOALZ_ABI,
        signer
    );
    const withdrawTx = await goalz.withdraw(goalId);
    await withdrawTx.wait();
};

export const automateDeposit = async (goalId: BigNumber, amount: BigNumber, frequency: BigNumber) => {
    const provider = await getProvider();
    const signer = await getSigner(provider);
    const goalz = new ethers.Contract(
        GOALZ_ADDRESS,
        GOALZ_ABI,
        signer
    );
    const automateDepositTx = await goalz.automateDeposit(goalId, amount, frequency);
    await automateDepositTx.wait();
};

export const cancelAutomateDeposit = async (goalId: BigNumber) => {
    const provider = await getProvider();
    const signer = await getSigner(provider);
    const goalz = new ethers.Contract(
        GOALZ_ADDRESS,
        GOALZ_ABI,
        signer
    );
    const cancelAutomateDepositTx = await goalz.cancelAutomateDeposit(goalId);
    await cancelAutomateDepositTx.wait();
};


