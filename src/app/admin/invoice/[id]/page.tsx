
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ConfirmPaymentButton from './ConfirmPaymentButton';

export default async function AdminInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // "id" here should be likely invoiceNumber or internal ID. 
    // Request said "/admin/invoice/[id]". Let's assume invoiceNumber or DB ID.
    // I'll try to find by ID first, then InvoiceNumber.
    const invoice = await prisma.invoice.findFirst({
        where: { OR: [{ id }, { invoiceNumber: id }] },
        include: { order: true }
    });

    if (!invoice) return notFound();

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">Manage Invoice: {invoice.invoiceNumber}</h1>
                <span className={`px-4 py-2 rounded-full font-bold text-sm ${invoice.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                    {invoice.paymentStatus}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h3 className="text-gray-500 text-sm mb-2 font-bold uppercase">Customer</h3>
                    <div className="font-bold">{invoice.order.customerName}</div>
                    <div>{invoice.order.customerPhone}</div>
                    <div>{invoice.order.customerEmail}</div>
                </div>

                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h3 className="text-gray-500 text-sm mb-2 font-bold uppercase">Payment Details</h3>
                    <div className="flex justify-between mb-1">
                        <span>Total</span>
                        <span className="font-bold">Rp {Number(invoice.totalAmount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                        <span>Method</span>
                        <span>{invoice.paymentMethod || '-'}</span>
                    </div>
                    {invoice.paidAt && (
                        <div className="flex justify-between mt-2 text-green-600 text-sm">
                            <span>Paid At</span>
                            <span>{new Date(invoice.paidAt).toLocaleString()}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-slate-50 p-8 rounded-xl flex items-center justify-between">
                <div>
                    <h3 className="font-bold mb-1">Actions</h3>
                    <p className="text-sm text-gray-500">Update status and notify customer</p>
                </div>

                <div className="flex gap-4">
                    <a
                        href={`/invoice/${invoice.invoiceNumber}`}
                        target="_blank"
                        className="bg-white border hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-lg font-bold transition"
                    >
                        View Public Invoice
                    </a>

                    {invoice.paymentStatus !== 'PAID' && (
                        <ConfirmPaymentButton invoiceNumber={invoice.invoiceNumber} />
                    )}
                </div>
            </div>
        </div>
    );
}
