import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useAccount, useContractRead } from "wagmi";
import { GOALZ_ADDRESS, GOALZ_ABI } from "../config/constants";
import { formatTokenAmount } from "../utils/helpers";
import Link from "next/link";

interface GoalData {
    what: string;
    why: string;
    currentAmount: string;
    targetAmount: string;
    targetDate: string;
};

const GoalRow = ({ goalIndex }) => {

    const { address } = useAccount();
    const [isExpanded, setIsExpanded] = useState(false);
    const [depositAmount, setDepositAmount] = useState("");
    const [goalProgress, setGoalProgress] = useState(0);
    const [goalData, setGoalData] = useState<GoalData>({
        what: "",
        why: "",
        currentAmount: "",
        targetAmount: "",
        targetDate: "",
    });

    // Get Goal Data
    const goal = useContractRead({
        addressOrName: GOALZ_ADDRESS,
        contractInterface: GOALZ_ABI,
        functionName: "savingsGoals",
        args: [goalIndex],
        watch: true,
    });

    // ---
    // Format the goal data
    useEffect(() => {
        if (goal.data) {
            const targetDate = new Date(goal.data.targetDate.mul(1000).toNumber());
            const goalProgress = goal.data.currentAmount.mul(100).div(goal.data.targetAmount).toNumber();
            setGoalProgress(goalProgress);
            setGoalData({
                what: goal.data[0],
                why: goal.data[1],
                currentAmount: formatTokenAmount(goal.data[2], 18, 0),
                targetAmount: formatTokenAmount(goal.data[3], 18, 0),
                targetDate: formatDate(targetDate)
            });
        }
    }, [goal.data]);

    // ---
    // Format a date
    const formatDate = (date: Date) => {
        return date.toLocaleString("en", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).toString();
    };

    // Function to toggle the expansion of the row
    const toggleExpansion = () => {
        setIsExpanded(!isExpanded);
    };

    // ---
    // Handle depositing funds into a goal
    const handleDeposit = () => {
        // Get the amount to deposit
        const amount = (document.getElementById(`deposit-amount-${goalIndex}`) as HTMLInputElement).value;
    }

    return (
        <>
            <tr onClick={toggleExpansion}>
                <td>
                    <div className="progress">
                        <div className="progress-bar" role="progressbar" style={{ width: `${goalProgress}%` }}></div>
                    </div>
                </td>
                <td>{goalData.what}</td>
                <td>{goalData.why}</td>
                <td>{goalData.targetAmount}</td>
                <td>{goalData.currentAmount}</td>
                <td>{goalData.targetDate}</td>
            </tr>
            {isExpanded && (
                <tr>
                    <td colSpan={1}></td>
                    <td colSpan={2}>
                        <div>
                            <strong>One-time Deposit</strong>
                            <div className="input-group mb-3">
                                <input
                                    type="number"
                                    className="form-control"
                                    id={`deposit-amount-${goalIndex}`}
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    placeholder="0" />
                                <span className="input-group-text">USDC</span>

                            </div>

                            <div className="btn-group" role="group">
                                <button className="btn btn-outline-primary" type="button" id={`deposit-button-${goalIndex}`}>Deposit</button>
                                <button className="btn btn-outline-success" type="button" id={`approve-button-${goalIndex}`}>Approve</button>
                            </div>
                        </div>
                        <br />
                        <div>
                            <strong>Automate Deposit</strong>
                            <div className="form-group">
                                <label className="form-label" htmlFor={`deposit-amount-${goalIndex}`}>Amount</label>
                                <div className="input-group mb-3">
                                    <input
                                        type="number"
                                        className="form-control"
                                        id={`deposit-amount-${goalIndex}`}
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value)}
                                        placeholder="0" />
                                    <br />
                                    <span className="input-group-text">USDC</span>
                                </div>
                                <label className="form-label" htmlFor="{`deposit-frequency-${goalIndex}`}">Frequency</label>
                                <div className="input-group mb-3">
                                    <input
                                        type="number"
                                        className="form-control"
                                        id={`deposit-frequency-${goalIndex}`}
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value)}
                                        placeholder="0" />
                                    <span className="input-group-text">Days</span>
                                </div>
                                <div className="input-group mb-3">
                                    <button className="btn btn-outline-secondary" type="button" id="button-addon2">Automate</button>
                                </div>
                            </div>
                        </div>
                    </td>

                </tr>
            )}
        </>
    );
};

export default GoalRow;
