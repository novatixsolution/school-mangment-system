import { supabase } from '@/lib/supabase/client';
import { notFound } from 'next/navigation';

export default async function VerifyChallanPage({ params }: { params: { challanId: string } }) {
    // Fetch challan data
    const { data: challan, error } = await supabase
        .from('fee_challans')
        .select(`
      *,
      student:students(
        name,
        father_name,
        roll_number,
        class:classes(class_name)
      )
    `)
        .eq('id', params.challanId)
        .single();

    if (error || !challan) {
        notFound();
    }

    const isPaid = challan.status === 'paid';

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${isPaid ? 'bg-green-100' : 'bg-yellow-100'
                        }`}>
                        <svg
                            className={`w-12 h-12 ${isPaid ? 'text-green-600' : 'text-yellow-600'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            {isPaid ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            )}
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Challan Verification
                    </h1>
                    <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {isPaid ? '✓ PAID' : '⏳ PENDING'}
                    </div>
                </div>

                {/* Challan Details */}
                <div className="space-y-4">
                    <div className="border-b pb-4">
                        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Challan Information</h2>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Challan No:</span>
                                <span className="font-semibold">{challan.challan_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Month:</span>
                                <span className="font-semibol className=" font-bold">{new Date(challan.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Due Date:</span>
                            <span className="font-semibold text-red-600">
                                {new Date(challan.due_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="border-b pb-4">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Student Information</h2>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Name:</span>
                            <span className="font-semibold">{challan.student?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Father:</span>
                            <span className="font-semibold">{challan.student?.father_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Class:</span>
                            <span className="font-semibold">{challan.student?.class?.class_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Roll No:</span>
                            <span className="font-semibold">{challan.student?.roll_number}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-700">Total Amount:</span>
                        <span className="text-2xl font-bold text-blue-600">
                            Rs {challan.total_amount.toLocaleString()}
                        </span>
                    </div>
                </div>

                {isPaid && challan.paid_date && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-green-800">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <div className="font-semibold">Payment Received</div>
                                <div className="text-sm">
                                    {new Date(challan.paid_date).toLocaleDateString('en-US', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-gray-500">
                <p>This is a digitally verified challan</p>
                <p className="mt-1">For queries, contact your school administration</p>
            </div>
        </div>
    </div >
  );
}
