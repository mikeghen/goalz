import { BigNumber, ethers } from 'ethers';
import { GOALZ_ADDRESS, GOALZ_ABI, GOALZ_USD_ADDRESS, USDC_ADDRESS, ERC20_ABI } from '../config/constants'; 

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

export const approve = async () => {
    const provider = await getProvider();
    const signer = await getSigner(provider);
    const contract = new ethers.Contract(
        USDC_ADDRESS,
        ERC20_ABI,
        signer
    );

    // TODO: No max approval
    const maxApprovalAmount = ethers.constants.MaxUint256;
    const approvalTx = await contract.approve(GOALZ_ADDRESS, maxApprovalAmount);
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
    const goalTx = await goalz.setGoal(what, why, targetAmount, targetDate, USDC_ADDRESS);
    return await goalTx.wait();
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
    const depositTx = await goalz.deposit(goalId, amount, {gasLimit: 2000000});
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

export const getGoalData = async (goalId: BigNumber) => {
    const provider = await getProvider();
    const signer = await getSigner(provider);
    const goalz = new ethers.Contract(
        GOALZ_ADDRESS,
        GOALZ_ABI,
        signer
    );
    const goalData = await goalz.savingsGoals(goalId);
    return goalData;
}

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



