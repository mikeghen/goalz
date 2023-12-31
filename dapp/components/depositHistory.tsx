import React, { useState, useEffect } from 'react';
import { useAccount, useSigner } from 'wagmi';
import { getEvents, getGoalData } from '../utils/ethereum';
import { formatTokenAmount } from '../utils/helpers';

const DepositHistory = () => {
    const { address } = useAccount();
    const { data: signer } = useSigner();

    const [depositEvents, setDepositEvents] = useState([]);

    const getDepositEvents = async () => {
        const deposits = await getEvents();
        // loop over all the deposits and enrich them with the goal data
        const enrichedDeposits = await Promise.all(
            deposits.map(async (deposit) => {
                // Get the goalId from the deposit
                const goalId = deposit.args.goalId;
                // Get the goal data from the goalId
                const goalData = await getGoalData(goalId);
                // Add the goal data to the deposit
                const block = await deposit.getBlock();
                return {
                    goal: goalData[0],
                    date: formatDate(new Date(block.timestamp * 1000)),
                    amount: formatTokenAmount(deposit.args.amount, 18, 2),
                    transactionHash: deposit.transactionHash,
                };
            })
        );

        setDepositEvents(enrichedDeposits);
    };

    // Format a date
    const formatDate = (date) => {
        return date.toLocaleString('en', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    useEffect(() => {
        if (address && signer) {
            getDepositEvents();
        }
    }, [address, signer]);

    return (
        <div className="container">
            <div className="row">
                <div className="col-md-12 mb-4 mb-md-0">
                    <div className="card">
                        <div className="card-header">Your Deposits</div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Goal</th>
                                            <th>Amount</th>
                                            <th>Transaction</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {depositEvents.length === 0 ? (
                                            <tr>
                                                <td colSpan={3}>No deposit events yet.</td>
                                            </tr>
                                        ) : (
                                            depositEvents.map((depositEvent, index) => (
                                                <tr key={index}>
                                                    <td>{depositEvent.date}</td>
                                                    <td>{depositEvent.goal}</td>
                                                    <td>{depositEvent.amount}</td>
                                                    <td>{depositEvent.transactionHash}</td>
                                                </tr>
                                            ))
                                        )}
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

export default DepositHistory;
