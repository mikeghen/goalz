import React from 'react';


const CreateGoals = () => {
    const handleFindEvent = () => {
        // Creating an event will create a new stealth meta-address and save this information to a local database

    };

    const handleClaimPayment = () => {
        // This method will transfer ETH from the address holding the payment a specified address
    }

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
                                <input type="text" className="form-control" id="why" placeholder="Go with my friends to Colorado"/>
                            </div>
                            <div className="form-group">
                                <label htmlFor="eventIdInput">How much USDC are you saving for this goal?</label>
                                <input type="text" className="form-control" id="targetAmount" placeholder="1000"/>
                            </div>
                            <div className="form-group">
                                <label htmlFor="eventIdInput">When do you want to reach this savings goal?</label>
                                <input type="text" className="form-control" id="targetDate" placeholder="90 days"/>
                            </div>
                            <br />
                            <button className="btn btn-primary" onClick={handleFindEvent}>
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


