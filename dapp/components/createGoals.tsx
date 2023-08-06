import React from 'react';


const CreateGoals = () => {

    


    const handleCreateGoal = () => {
        // Creating an event will create a new stealth meta-address and save this information to a local database
        console.log("Create Goal");
        // Get the what, why, targetAmount, and targetDate from the form
        const what = (document.getElementById("what") as HTMLInputElement).value;
        const why = (document.getElementById("why") as HTMLInputElement).value;
        const targetAmount = (document.getElementById("targetAmount") as HTMLInputElement).value;
        const targetDate = (document.getElementById("targetDate") as HTMLInputElement).value;
        // Log the values to the console
        console.log(what);
        console.log(why);
        console.log(targetAmount);
        console.log(targetDate);

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
                            <div className="form-group">
                                <label htmlFor="eventIdInput">Why are you saving?</label>
                                <input type="text" className="form-control" id="why" placeholder="Go with my friends to Colorado" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="eventIdInput">How much USDC are you saving for this goal?</label>
                                <input type="number" className="form-control" id="targetAmount" placeholder="1000" />
                            </div>
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
                                Create Goal
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


