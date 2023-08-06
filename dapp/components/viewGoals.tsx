import React from 'react';


const ViewGoals = () => {
    const handleCreateEvent = () => {
        // Creating an event will create a new stealth meta-address and save this information to a local database

    };

    const handleClaimPayment = () => {
        // This method will transfer ETH from the address holding the payment a specified address
    }

    return (
        <div className="container">
            <h3 className="text-align-center">Welcome back!</h3><br />
            <div className="row">
                <div className="col-md-12 mb-4 mb-md-0">
                    <div className="card">
                        <div className="card-header">Your Goalz</div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Progress</th>
                                            <th>What</th>
                                            <th>Why</th>
                                            <th>Pace</th>
                                            <th>Target Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>
                                                <div className="progress">
                                                    <div className="progress-bar" role="progressbar" style={{width: '35%'}} aria-valuenow="35" aria-valuemin="0" aria-valuemax="100">35%</div>
                                                </div>
                                            </td>
                                            <td>Winter Vacation</td>
                                            <td>I want to go with my friends to Colorado</td>
                                            <td>350/1000 USDC</td>
                                            <td>2024-01-01</td>
                                            <td>
                                            <div className="input-group input-group-sm mb-2">
                                                <input type="number" style={{width: "50px"}} className="form-control" min="0" placeholder="0" ></input>
                                                <div className="input-group-append">
                                                    <button className="btn btn-primary" type="button" id="button-deposit">Deposit</button>
                                                </div>
                                            </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewGoals;


