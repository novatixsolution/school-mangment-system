import React from 'react';
import { getSectionStyle } from '../TemplateBase';

interface FeeTableSectionProps {
    config: Record<string, any>;
    feeData?: {
        monthly_fee: number;
        admission_fee: number;
        exam_fee: number;
        other_fees: number;
        discount: number;
        total_amount: number;
    };
}

export function FeeTableSection({ config, feeData }: FeeTableSectionProps) {
    const sectionStyle = getSectionStyle(config);

    // Sample fee data
    const fees = feeData || {
        monthly_fee: 2250,
        admission_fee: 1150,
        exam_fee: 850,
        other_fees: 650,
        discount: 800,
        total_amount: 4100,
    };

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('en-PK');
    };

    const subtotal = fees.monthly_fee + fees.admission_fee + fees.exam_fee + fees.other_fees;

    const getTableClass = () => {
        const style = config.table_style || 'bordered';
        const baseClass = 'w-full';

        if (style === 'bordered') {
            return `${baseClass} border-collapse border border-gray-300`;
        } else if (style === 'striped') {
            return `${baseClass} border-collapse`;
        }
        return baseClass;
    };

    const getCellClass = (isHeader = false) => {
        const style = config.table_style || 'bordered';
        let className = 'py-2 px-3 text-left';

        if (style === 'bordered') {
            className += ' border border-gray-300';
        } else if (style === 'striped') {
            className += isHeader ? ' border-b-2 border-gray-400' : '';
        }

        return className;
    };

    const getRowClass = (index: number, isTotal = false) => {
        const style = config.table_style || 'bordered';

        if (isTotal && config.highlight_total) {
            return 'font-bold bg-gray-100';
        }

        if (style === 'striped' && index % 2 === 0) {
            return 'bg-gray-50';
        }

        return '';
    };

    return (
        <div style={sectionStyle} className="fee-table-section">
            <h3
                className="text-base font-semibold mb-3"
                style={{ color: 'var(--primary-color)' }}
            >
                Fee Breakdown
            </h3>

            <table className={getTableClass()}>
                <thead>
                    <tr style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                        <th className={getCellClass(true)}>Fee Type</th>
                        <th className={`${getCellClass(true)} text-right`}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className={getRowClass(0)}>
                        <td className={getCellClass()}>Tuition Fee</td>
                        <td className={`${getCellClass()} text-right`}>Rs {formatCurrency(fees.monthly_fee)}</td>
                    </tr>

                    <tr className={getRowClass(1)}>
                        <td className={getCellClass()}>Admission Fee</td>
                        <td className={`${getCellClass()} text-right`}>Rs {formatCurrency(fees.admission_fee)}</td>
                    </tr>

                    <tr className={getRowClass(2)}>
                        <td className={getCellClass()}>Exam Fee</td>
                        <td className={`${getCellClass()} text-right`}>Rs {formatCurrency(fees.exam_fee)}</td>
                    </tr>

                    <tr className={getRowClass(3)}>
                        <td className={getCellClass()}>Other Fees</td>
                        <td className={`${getCellClass()} text-right`}>Rs {formatCurrency(fees.other_fees)}</td>
                    </tr>

                    {config.show_subtotal && (
                        <tr className="border-t-2 font-medium">
                            <td className={getCellClass()}>Subtotal</td>
                            <td className={`${getCellClass()} text-right`}>Rs {formatCurrency(subtotal)}</td>
                        </tr>
                    )}

                    {config.show_discount && fees.discount > 0 && (
                        <tr className="text-green-600">
                            <td className={getCellClass()}>Discount</td>
                            <td className={`${getCellClass()} text-right`}>- Rs {formatCurrency(fees.discount)}</td>
                        </tr>
                    )}

                    <tr className={getRowClass(0, true)}>
                        <td
                            className={getCellClass()}
                            style={{
                                fontSize: '16px',
                                fontWeight: 'bold',
                                color: 'var(--primary-color)',
                            }}
                        >
                            TOTAL AMOUNT
                        </td>
                        <td
                            className={`${getCellClass()} text-right`}
                            style={{
                                fontSize: '16px',
                                fontWeight: 'bold',
                                color: 'var(--primary-color)',
                            }}
                        >
                            Rs {formatCurrency(fees.total_amount)}
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* Additional Info */}
            <div className="mt-3 text-xs text-gray-500 text-center">
                Month: February 2026 | Due Date: 15 Feb 2026
            </div>
        </div>
    );
}
