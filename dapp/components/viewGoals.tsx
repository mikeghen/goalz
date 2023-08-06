import React from 'react';
import { useState, useEffect } from 'react';
import { useAccount, useContractRead, useSigner } from "wagmi";
import { ethers } from 'ethers';
import { GOALZ_USD_ADDRESS, GOALZ_ADDRESS, ERC20_ABI, GOALZ_ABI } from '../config/constants';
import { formatTokenAmount } from '../utils/helpers';
import GoalRow from './goalRow';
import { use } from 'chai';
import { setGoal } from '../utils/ethereum';

const ViewGoals = () => {

    const {address} = useAccount();
    const { data: signer } = useSigner();

    const [goalCount, setGoalCount] = useState(0);

    // ---
    // Get the goals that the user has created
    const userGoalzCount = useContractRead({
        addressOrName: GOALZ_ADDRESS,
        contractInterface: GOALZ_ABI,
        functionName: 'balanceOf',
        args: [address],
        watch: true,
    });

    useEffect(() => {
        console.log("address", address);
        if(userGoalzCount.data < ethers.BigNumber.from("390000000000000000000")) {
            setGoalCount(userGoalzCount.data.toNumber());
        } else {
            setGoalCount(0);
        }
    }, [userGoalzCount.data]);

    return (
        <div className="container">
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
                                            <th>Saved (USDC)</th>
                                            <th>Target (USDC)</th>
                                            <th>Target Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...Array(goalCount).keys()].reverse().map((goalIndex) => (
                                            <GoalRow goalIndex={goalIndex} key={goalIndex} />
                                        ))}
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


