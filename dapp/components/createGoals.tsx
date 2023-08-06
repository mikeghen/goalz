import React from 'react';
import { setGoal } from '../utils/ethereum';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';


const CreateGoals = () => {

    const [setGoalLoading, setSetGoalLoading] = React.useState(false);
    const [monthlySavings, setMonthlySavings] = React.useState("0.00");
 

    const handleCreateGoal = async () => {
        // Creating an event will create a new stealth meta-address and save this information to a local database
        console.log("Create Goal");
        // Get the what, why, targetAmount, and targetDate from the form
        const what = (document.getElementById("what") as HTMLInputElement).value;
        const why = (document.getElementById("why") as HTMLInputElement).value;
        const targetAmount = (document.getElementById("targetAmount") as HTMLInputElement).value;
        const targetDate = (document.getElementById("targetDate") as HTMLInputElement).value;
        // Transfor the targetAmount and targetDate into the correct format
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
            await setGoal(what, why, targetAmountBigNumber, targetDateUnix);
            toast.success('Goal set!');
        } catch (error) {
            toast.error('Error setting goal.');
            console.log("setGoal error:", error);
        } finally {
            setSetGoalLoading(false);
        }

    };

    // Function that will project how much per month (30 days) we will need to save to reach the targetAmount
    const calculateMonthlySavings = () => {
        // Get the targetAmount and targetDate from the form
        const targetAmount = (document.getElementById("targetAmount") as HTMLInputElement).value;
        const targetDate = (document.getElementById("targetDate") as HTMLInputElement).value;
        if(targetDate === "") {
            setMonthlySavings("0.00");
        } else {
            // Calculate the monthly savings
            const dailySavings = Number(targetAmount) / Number(targetDate);
            const monthlySavings = dailySavings * 30;
            setMonthlySavings(monthlySavings.toFixed(2));
        }
    };

    return (
        <div className="container">
            <div className="row">
                <div className="col-md-6 mb-4 mb-md-0">
                    <div className="card">
                        <div className="card-header">Your Goal</div>
                        <div className="card-body">
                            <div className="form-group">
                                <label htmlFor="eventIdInput">What's the goal?</label>
                                <input type="text" className="form-control" id="what"  />
                            </div>
                            <br />
                            <div className="form-group">
                                <label htmlFor="eventIdInput">Why are you saving?</label>
                                <input type="text" className="form-control" id="why" />
                            </div>
                            <br />
                            <div className="form-group">
                                <label htmlFor="eventIdInput">How much USDC are you saving for this goal?</label>
                                <input type="number" className="form-control" id="targetAmount" />
                            </div>
                            <br />
                        </div>
                    </div>
                </div>
                <div className="col-md-6 mb-4 mb-md-0">
                    <div className="card">
                        <div className="card-header">Your Plan</div>
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
                                        onChange={calculateMonthlySavings} />
                                    <span className="input-group-text">days</span>
                                </div>
                            </div>
                            <br />
                            <div className="alert alert-success" role="alert">
                                You need to save <strong>${monthlySavings}</strong> per month to reach your goal.
                            </div>
                            <br />
                            <button className="btn btn-primary" onClick={handleCreateGoal}>
                                Start Saving
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


