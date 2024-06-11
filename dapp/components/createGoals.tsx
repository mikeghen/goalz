import React, { useState, useEffect } from 'react';
import { automateDeposit, setGoal, approve } from '../utils/ethereum';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { USDC_ADDRESS, WETH_ADDRESS, GOALZ_ADDRESS, ERC20_ABI, GOALZ_USDC_ADDRESS } from '../config/constants';
import { useAccount, useReadContract } from 'wagmi';

const EmojiSelect = ({ onSelect, selectedEmoji }: { onSelect: (event: React.ChangeEvent<HTMLSelectElement>) => void, selectedEmoji: string }) => {
    const emojis = ['😀', '🎉', '💰', '🏖️', '🚀', '❤️', '🌟', '💻', '🚗']; // Add more emojis as needed

    return (
        <select className="form-control" onChange={onSelect} value={selectedEmoji}>
            <option value="">Select an emoji</option>
            {emojis.map((emoji, index) => (
                <option key={index} value={emoji}>
                    {emoji}
                </option>
            ))}
        </select>
    );
};

const TokenSelect = ({ onSelect, selectedToken }: { onSelect: (event: React.ChangeEvent<HTMLSelectElement>) => void, selectedToken: string }) => {
    return (
        <select className="form-control" onChange={onSelect} value={selectedToken}>
            <option value={USDC_ADDRESS}>USDC</option>
            <option value={WETH_ADDRESS}>WETH</option>
        </select>
    );
};

const ExampleGoalCard = ({ goal, emoji, token, onStart }: { goal: string, emoji: string, token: string, onStart: () => void }) => {
    return (
        <div className="col-md-3 mb-4">
            <div className="card">
                <div className="card-body d-flex flex-column align-items-center justify-content-center">
                    <p className="text-center">{`${goal} ${emoji}`}</p>
                    <button className="btn btn-outline-primary mt-2" onClick={onStart}>
                        Start
                    </button>
                </div>
            </div>
        </div>
    );
};

const CreateGoals = () => {
    const { address } = useAccount();
    const [setGoalLoading, setSetGoalLoading] = useState(false);
    const [approveLoading, setApproveLoading] = useState(false); // Add loading state for Approve button
    const [savingsAmount, setSavingsAmount] = useState("0.00");
    const [showDepositForm, setShowDepositForm] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');
    const [frequencyAmount, setFrequencyAmount] = useState('');
    const [frequencyUnit, setFrequencyUnit] = useState("days");
    const [emoji, setEmoji] = useState('');
    const [depositToken, setDepositToken] = useState(USDC_ADDRESS);
    const [unit, setUnit] = useState('USDC');
    const [what, setWhat] = useState('');
    const [why, setWhy] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [isApproved, setIsApproved] = useState(false);

    const allowance = useReadContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address, GOALZ_ADDRESS],
    });

    const exampleGoals = [
        { goal: 'Save for a trip', emoji: '🏖️', token: USDC_ADDRESS, amount: '' },
        { goal: 'Save for a macbook', emoji: '💻', token: USDC_ADDRESS, amount: '' },
        { goal: 'Save for a car', emoji: '🚗', token: USDC_ADDRESS, amount: '' },
        { goal: 'Save 1 ETH', emoji: '💰', token: WETH_ADDRESS, amount: '1' },
    ];

    useEffect(() => {
        if (allowance.data && allowance.data.gte(ethers.constants.MaxUint256.div(2))) {
            setIsApproved(true);
        } else {
            setIsApproved(false);
        }
    }, [allowance.data]);

    const handleCreateGoal = async () => {
        console.log("Create Goal");
        const what = (document.getElementById("what") as HTMLInputElement).value;
        const why = emoji;
        const targetAmount = (document.getElementById("targetAmount") as HTMLInputElement).value;
        const targetDate = (document.getElementById("targetDate") as HTMLInputElement).value;
        let decimals = 18;
        if (depositToken === USDC_ADDRESS) {
            decimals = 6;
        }
        const targetAmountBigNumber = ethers.BigNumber.from(targetAmount).mul(ethers.BigNumber.from(10).pow(decimals));
        const targetDateUnix = ethers.BigNumber.from(
            Math.floor(Date.now() / 1000) + (Number(targetDate) * 24 * 60 * 60)
        );
        console.log("what", what);
        console.log("why", why);
        console.log("targetAmount", targetAmountBigNumber.toString());
        console.log("targetDate", targetDateUnix);

        try {
            setSetGoalLoading(true);
            let result = await setGoal(depositToken, what, why, targetAmountBigNumber, targetDateUnix);

            if (showDepositForm && isApproved) {
                toast.success(`Goal set! Automating deposit...`);
                let depositAmountBigNumber;
                const goalId = result.events[1].args.goalId;
                if (depositToken === USDC_ADDRESS) {
                    depositAmountBigNumber = ethers.utils.parseUnits(depositAmount, 6);
                } else {
                    depositAmountBigNumber = ethers.utils.parseUnits(depositAmount, 18);
                }

                let frequencySeconds;
                switch (frequencyUnit) {
                    case "minutes":
                        frequencySeconds = ethers.BigNumber.from(frequencyAmount).mul(60);
                        break;
                    case "hours":
                        frequencySeconds = ethers.BigNumber.from(frequencyAmount).mul(3600);
                        break;
                    case "days":
                        frequencySeconds = ethers.BigNumber.from(frequencyAmount).mul(86400);
                        break;
                    case "weeks":
                        frequencySeconds = ethers.BigNumber.from(frequencyAmount).mul(604800);
                        break;
                    case "months":
                        frequencySeconds = ethers.BigNumber.from(frequencyAmount).mul(2592000); // Approximation
                        break;
                    default:
                        frequencySeconds = ethers.BigNumber.from(frequencyAmount).mul(86400);
                }

                await automateDeposit(goalId, depositAmountBigNumber, frequencySeconds);
                toast.success(`${depositAmount} ${unit} will be deposited every ${frequencyAmount} ${frequencyUnit} toward your goal.`);
            } else {
                toast.success('Goal set!');
            }
        } catch (error) {
            toast.error('Error setting goal.');
            console.log("setGoal error:", error);
        } finally {
            setSetGoalLoading(false);
        }
    };

    const handleApprove = async () => {
        try {
            setApproveLoading(true); // Start loading
            await approve(depositToken);
            toast.success('Approved contract to spend tokens.');
            setIsApproved(true);
        } catch (error) {
            toast.error('Error approving contract.');
            console.log("approve error:", error);
        } finally {
            setApproveLoading(false); // Stop loading
        }
    };

    const handleEmojiSelectChange = (event: any) => {
        const selectedValue = event.target.value;
        setEmoji(selectedValue);
    };

    const handleTokenSelectChange = (event: any) => {
        const selectedValue = event.target.value;
        console.log("depositToken", selectedValue)
        if (selectedValue === USDC_ADDRESS) {
            setUnit("USDC");
        }
        if (selectedValue === WETH_ADDRESS) {
            setUnit("WETH");
        }
        setDepositToken(selectedValue);
    };

    const calculateSavings = () => {
        const targetAmount = (document.getElementById("targetAmount") as HTMLInputElement).value;
        const targetDate = (document.getElementById("targetDate") as HTMLInputElement).value;
        if (targetDate === "") {
            setSavingsAmount("0.00");
        } else {
            const dailySavings = Number(targetAmount) / Number(targetDate);
            const savingsAmount = dailySavings * 30;
            setSavingsAmount(savingsAmount.toFixed(2));
        }
    };

    const handleDepositAmountChange = (event: any) => {
        setDepositAmount(event.target.value);
    };

    const handleFrequencyAmountChange = (event: any) => {
        setFrequencyAmount(event.target.value);
    };

    const setExampleGoal = (goal: any, emoji: any, token: any, amount: any) => {
        (document.getElementById("what") as HTMLInputElement).value = goal;
        (document.getElementById("targetAmount") as HTMLInputElement).value = amount;
        setEmoji(emoji);
        setDepositToken(token);
        setUnit(token === USDC_ADDRESS ? "USDC" : "WETH");
    };

    return (
        <div className="container">
            <div className="row">
                {exampleGoals.map((exampleGoal, index) => (
                    <ExampleGoalCard
                        key={index}
                        goal={exampleGoal.goal}
                        emoji={exampleGoal.emoji}
                        token={exampleGoal.token}
                        onStart={() =>
                            setExampleGoal(
                                exampleGoal.goal,
                                exampleGoal.emoji,
                                exampleGoal.token,
                                exampleGoal.amount
                            )
                        }
                    />
                ))}
            </div>
            <div className="row">
                <div className="col-md-6 mb-4 mb-md-0">
                    <div className="card border-dark">
                        <div className="card-header bg-secondary text-white">Your Goal</div>
                        <div className="card-body">
                            <div className="form-group">
                                <label htmlFor="eventIdInput">What is the goal?</label>
                                <input type="text" className="form-control" id="what" />
                            </div>
                            <br />
                            <div className="form-group">
                                <label htmlFor="eventIdInput">Give your goal an emoji</label>
                                <EmojiSelect onSelect={handleEmojiSelectChange} selectedEmoji={emoji} />
                            </div>
                            <br />
                            <div className="form-group">
                                <label htmlFor="depositTokenInput">What token do you want to save?</label>
                                <TokenSelect onSelect={handleTokenSelectChange} selectedToken={depositToken} />
                            </div>
                            <br />
                            <div className="form-group">
                                <label htmlFor="eventIdInput">How much {unit} are you saving for this goal?</label>
                                <input type="number" className="form-control" id="targetAmount" />
                            </div>
                            <br />
                        </div>
                    </div>
                </div>
                <div className="col-md-6 mb-4 mb-md-0">
                    <div className="card border-dark">
                        <div className="card-header bg-secondary text-white">Your Plan</div>
                        <div className="card-body">
                            <div className="form-group">
                                <label htmlFor="targetDate" className="form-label">
                                    When do you want to reach this savings goal?
                                </label>
                                <div className="input-group">
                                    <input
                                        type="number"
                                        className="form-control"
                                        id="targetDate"
                                        onChange={calculateSavings} />
                                    <span className="input-group-text">days</span>
                                </div>
                            </div>
                            <br />
                            <div className="alert alert-success" role="alert">
                                You need to save <strong>{savingsAmount} {unit}</strong> per month to reach your goal.
                            </div>
                            <br />
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="depositCheckbox"
                                    checked={showDepositForm}
                                    onChange={() => setShowDepositForm(!showDepositForm)}
                                />
                                <label className="form-check-label" htmlFor="depositCheckbox">
                                    Automatically deposit
                                </label>
                            </div>
                            {showDepositForm && (
                                <div className="form-group mt-3">
                                    {!isApproved ? (
                                        <>
                                            <p className="text-primary"><strong>Please approve Goalz.</strong> Goalz Automation transfers {unit} from your wallet to this goal using Gelato.</p>
                                            <button className="btn btn-outline-primary" onClick={handleApprove} disabled={approveLoading}>
                                                {approveLoading ? (
                                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                ) : (
                                                    'Approve'
                                                )}
                                            </button>
                                        </>
                                    ) : (
                                        <div>
                                            <strong>Automate Deposit</strong>
                                            <div className="form-group">
                                                <label className="form-label" htmlFor={`auto-deposit-amount`}>Deposit {depositAmount} {unit} every {frequencyAmount} {frequencyUnit} </label>
                                                <div className="input-group mb-3">
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        id={`auto-deposit-amount`}
                                                        value={depositAmount}
                                                        onChange={handleDepositAmountChange}
                                                        placeholder="0" />
                                                    <span className="input-group-text">{unit}</span>
                                                </div>
                                                <div className="input-group mb-3">
                                                    <input
                                                        width={100}
                                                        type="number"
                                                        className="form-control"
                                                        id={`deposit-frequency`}
                                                        value={frequencyAmount}
                                                        onChange={handleFrequencyAmountChange}
                                                        placeholder="0" />
                                                    <select
                                                        className="form-select"
                                                        id={`frequency-unit`}
                                                        value={frequencyUnit}
                                                        onChange={(e) => setFrequencyUnit(e.target.value)}
                                                    >
                                                        <option value="minutes">Minutes</option>
                                                        <option value="hours">Hours</option>
                                                        <option value="days">Days</option>
                                                        <option value="weeks">Weeks</option>
                                                        <option value="months">Months</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            <br />
                            <button className="btn btn-primary" onClick={handleCreateGoal} disabled={showDepositForm && !isApproved}>
                                {setGoalLoading ? (
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                ) : (
                                    'Start Saving'
                                )}
                            </button>
                            <br />
                        </div>
                    </div>
                </div>
            </div>
            <br />
        </div>
    );
};

export default CreateGoals;
