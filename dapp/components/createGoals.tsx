import React, { useState } from 'react';
import { automateDeposit, setGoal } from '../utils/ethereum';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { USDC_ADDRESS, WETH_ADDRESS } from '../config/constants';

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
    const [setGoalLoading, setSetGoalLoading] = useState(false);
    const [savingsAmount, setSavingsAmount] = useState("0.00");
    const [showDepositForm, setShowDepositForm] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');
    const [frequencyAmount, setFrequencyAmount] = useState('');
    const [frequencyUnit, setFrequencyUnit] = useState("days"); // New state for frequency unit
    const [emoji, setEmoji] = useState('');
    const [depositToken, setDepositToken] = useState(USDC_ADDRESS); // [USDC_ADDRESS, WETH_ADDRESS]
    const [unit, setUnit] = useState('USDC');
    const [what, setWhat] = useState('');
    const [why, setWhy] = useState('');
    const [targetAmount, setTargetAmount] = useState('');

    const exampleGoals = [
        { goal: 'Save for a trip', emoji: '🏖️', token: USDC_ADDRESS, amount: '' },
        { goal: 'Save for a macbook', emoji: '💻', token: USDC_ADDRESS, amount: '' },
        { goal: 'Save for a car', emoji: '🚗', token: USDC_ADDRESS, amount: '' },
        { goal: 'Save 1 ETH', emoji: '💰', token: WETH_ADDRESS, amount: '1' },
    ];

    const handleCreateGoal = async () => {
        // Creating an event will create a new stealth meta-address and save this information to a local database
        console.log("Create Goal");
        // Get the what, why, targetAmount, and targetDate from the form
        const what = (document.getElementById("what") as HTMLInputElement).value;
        const why = emoji;
        const targetAmount = (document.getElementById("targetAmount") as HTMLInputElement).value;
        const targetDate = (document.getElementById("targetDate") as HTMLInputElement).value;
        // Transform the targetAmount and targetDate into the correct format
        const targetAmountBigNumber = ethers.BigNumber.from(targetAmount).mul(ethers.BigNumber.from(10).pow(18));
        const targetDateUnix = ethers.BigNumber.from(
            Math.floor(Date.now() / 1000) + (Number(targetDate) * 24 * 60 * 60)
        );
        // Log the values for inspection
        console.log("what", what);
        console.log("why", why);
        console.log("targetAmount", targetAmountBigNumber.toString());
        console.log("targetDate", targetDateUnix);

        // Try to set the goal
        try {
            setSetGoalLoading(true);
            let result = await setGoal(depositToken, what, why, targetAmountBigNumber, targetDateUnix);

            // Check if we're also creating an automatic deposit
            if (showDepositForm) {
                toast.success(`Goal set! Automating deposit...`);
                // Get the GoalCreated event to find the goalId of the created goal
                const goalId = result.events[1].args.goalId;
                // If so, set the depositAmount and frequency
                const depositAmountBigNumber = ethers.BigNumber.from(depositAmount).mul(ethers.BigNumber.from(10).pow(18));
                
                // Convert the frequency based on the selected unit
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
                        frequencySeconds = ethers.BigNumber.from(frequencyAmount).mul(86400); // Default to days
                }

                // Get the id of the goal just created
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

    // Function that will project how much per month (30 days) we will need to save to reach the targetAmount
    const calculateSavings = () => {
        // Get the targetAmount and targetDate from the form
        const targetAmount = (document.getElementById("targetAmount") as HTMLInputElement).value;
        const targetDate = (document.getElementById("targetDate") as HTMLInputElement).value;
        if (targetDate === "") {
            setSavingsAmount("0.00");
        } else {
            // Calculate the monthly savings
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
            {/* Row with example goal cards */}
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
                                    <label htmlFor="depositAmount" className="form-label">
                                        Deposit Amount:
                                    </label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        id="depositAmount"
                                        value={depositAmount}
                                        onChange={handleDepositAmountChange}
                                    />
                                    <label htmlFor="frequencyAmount" className="form-label mt-3">
                                        Frequency Amount:
                                    </label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        id="frequencyAmount"
                                        value={frequencyAmount}
                                        onChange={handleFrequencyAmountChange}
                                    />
                                    <label htmlFor="frequencyUnit" className="form-label mt-3">
                                        Frequency Unit:
                                    </label>
                                    <select
                                        className="form-control"
                                        id="frequencyUnit"
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
                            )}
                            <br />
                            <button className="btn btn-primary" onClick={handleCreateGoal}>
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
