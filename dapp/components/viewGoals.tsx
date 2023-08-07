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
        if(userGoalzCount.data) {
            console.log("userGoalzCount.data", userGoalzCount.data.toNumber());
            setGoalCount(userGoalzCount.data.toNumber());
        } else {
            setGoalCount(0);
        }
    }, [userGoalzCount.data]);

    return (
        <div className="container">
            <div className="row">
                <div className="col-md-12 mb-4 mb-md-0">
                    <div className="card border-dark">
                        <div className="card-header bg-secondary text-white">Your Goalz</div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>What</th>
                                            <th>Progress</th>
                                            <th></th>
                                            <th>Target Date</th>
                                            <th></th>
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


