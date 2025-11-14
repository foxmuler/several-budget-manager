
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAppContext } from '../context/AppContext';

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, remainingPercentage, color }: any) => {
    const radius = outerRadius + 20;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text
            x={x}
            y={y}
            fill={color}
            textAnchor={x > cx ? 'start' : 'end'}
            dominantBaseline="central"
            className="text-sm font-bold"
        >
            {`${(remainingPercentage).toFixed(0)}%`}
        </text>
    );
};


const DonutChartComponent = () => {
    const { budgets, getBudgetRemaining, getBudgetEffectiveColor } = useAppContext();

    const data = budgets.map(budget => {
        const remaining = getBudgetRemaining(budget.id);
        const initialAvailable = (budget.capitalTotal * budget.porcentajeUsable) / 100;
        const remainingPercentage = initialAvailable > 0 ? Math.max(0, (remaining / initialAvailable) * 100) : 0;
        
        return {
            id: budget.id,
            name: budget.descripcion,
            value: budget.capitalTotal,
            color: getBudgetEffectiveColor(budget),
            remainingPercentage,
        };
    });

    const handlePieClick = (data: any) => {
        if (data && data.id) {
            window.location.hash = `/budget/${data.id}`;
        }
    };

    if (budgets.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 h-64 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">Añade un capital para ver el gráfico.</p>
            </div>
        );
    }
    
    const totalUsableCapital = budgets.reduce((sum, budget) => sum + (budget.capitalTotal * budget.porcentajeUsable) / 100, 0);
    const totalRemaining = budgets.reduce((sum, budget) => sum + getBudgetRemaining(budget.id), 0);
    const totalSpent = totalUsableCapital - totalRemaining;

    return (
        <div className="relative h-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="80%"
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        onClick={(e) => handlePieClick(e)}
                        style={{ cursor: 'pointer' }}
                        labelLine={false}
                        label={renderCustomizedLabel}
                    >
                        {data.map((entry) => (
                            <Cell key={`cell-${entry.id}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip 
                        formatter={(value: number, name: string) => [value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }), name]}
                    />
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">{totalSpent.toLocaleString('es-ES', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</span>
                 <div className="w-12 h-px bg-gray-400 dark:bg-gray-600 my-1"></div>
                <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">{totalUsableCapital.toLocaleString('es-ES', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</span>
            </div>
        </div>
    );
};

export default DonutChartComponent;
