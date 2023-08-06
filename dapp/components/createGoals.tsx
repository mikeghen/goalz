import React from 'react';
import { setGoal } from '../utils/ethereum';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';


const CreateGoals = () => {

    const [setGoalLoading, setSetGoalLoading] = React.useState(false);


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

    return (
        <div className="container">
            <div className="row">
                <div className="col-md-12 mb-4 mb-md-0">
                    <div className="card">
                        <div className="card-header">Create a new Goal</div>
                        <div className="card-body">
                            <div className="form-group">
                                <label htmlFor="eventIdInput">What's the goal?</label>
                                <input type="text" className="form-control" id="what" placeholder="Winter Vacation" />
                            </div>
                            <br />
                            <div className="form-group">
                                <label htmlFor="eventIdInput">Why are you saving?</label>
                                <input type="text" className="form-control" id="why" placeholder="Go with my friends to Colorado" />
                            </div>
                            <br />
                            <div className="form-group">
                                <label htmlFor="eventIdInput">How much USDC are you saving for this goal?</label>
                                <input type="number" className="form-control" id="targetAmount" placeholder="1000" />
                            </div>
                            <br />
                            <div className="form-group">
                                <label htmlFor="targetDate" className="form-label">
                                    When do you want to reach this savings goal?
                                </label>
                                <div className="input-group">
                                    <input type="number" className="form-control" id="targetDate" placeholder="90" />
                                    <span className="input-group-text">days</span>
                                </div>
                            </div>
                            <br />
                            <button className="btn btn-primary" onClick={handleCreateGoal}>
                                Set Goal
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <br />
        </div>
    );
};

export default CreateGoals;


