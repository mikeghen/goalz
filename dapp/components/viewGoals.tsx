import React from 'react';
import { useState, useEffect } from 'react';
import { useAccount, useContractRead, useSigner } from "wagmi";
import { GOALZ_USD_ADDRESS, ERC20_ABI } from '../config/constants';
import { formatTokenAmount } from '../utils/helpers';

const ViewGoals = () => {

    const {address} = useAccount();
    const { data: signer } = useSigner();

    const [goalzUsdBalance, getGoalzUsdBalance] = useState("0.00");
    
    // Get the balance of the user has available for deposits
    const goalzUsdBalanceData = useContractRead({
      addressOrName: GOALZ_USD_ADDRESS,
      contractInterface: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address],
      watch: true,
    });
  
    useEffect(() => {
      if (goalzUsdBalanceData.data) {
        getGoalzUsdBalance(formatTokenAmount(goalzUsdBalanceData.data, 18, 2));
      }
    }, [goalzUsdBalanceData.data]);
    
    // Handle depositing funds into a goal
    const handleDeposit = () => {
        console.log("Deposit");
    }

    return (
        <div className="container">
            <div className="row">
                <div className="col-md-6 mb-4 mb-md-0">
                    <h1 className="text-align-center">Welcome back to Goalz!</h1><br />
                </div>
                <div className="col-md-6 mb-4 mb-md-0">
                    <div className="card">
                        <div className="card-header">
                            Balances
                        </div>
                        <div className="card-body">
                            <div className="d-flex flex-wrap justify-content-between align-items-center">
                                <div className="mr-3">
                                    Available:
                                </div>
                                <div className="mr-3">
                                    <span>{goalzUsdBalance} USDC</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <br/>
                </div>
            </div>
            <div className="row">
                <div className="col-md-12 mb-4 mb-md-0">
                    <div className="card">
                        <div className="card-header">Your Goalz</div>
                        <div className="card-body">
                            <div>
                                {/* display how much goalz usd they have available */}
                                <div className="d-flex flex-wrap justify-content-between align-items-center">
                                    <div className="d-flex flex-wrap align-items-center">
                                        <div className="mr-3">
                                            Available to Deposit: 
                                        </div>
                                        <div className="mr-3">
                                            <span className="badge bg-success">{goalzUsdBalance} USDC</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <br />
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


