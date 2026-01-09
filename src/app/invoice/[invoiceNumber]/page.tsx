
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { generateQRCode } from '@/lib/qrcode';
import { format } from 'date-fns';
import StylePrintButton from './PrintButton';

interface InvoicePageProps {
    params: Promise<{ invoiceNumber: string }>;
}

export default async function InvoicePage({ params }: InvoicePageProps) {
    const resolvedParams = await params;
    const { invoiceNumber } = resolvedParams;

    const invoice = await prisma.invoice.findUnique({
        where: { invoiceNumber },
        include: {
            order: {
                include: {
                    orderItems: true
                }
            }
        }
    });

    if (!invoice) return notFound();

    // Generate QRs
    const qrPayment = invoice.qrPaymentUrl ? await generateQRCode(invoice.qrPaymentUrl) : '';
    const qrTracking = invoice.qrTrackingUrl ? await generateQRCode(invoice.qrTrackingUrl) : '';

    const isPaid = invoice.watermarkStatus === 'PAID';

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8 print:p-0 print:bg-white flex justify-center">

            <div className="bg-white shadow-lg w-full max-w-[210mm] min-h-[297mm] p-8 md:p-12 relative overflow-hidden print:shadow-none print:w-full">

                {/* Watermark */}
                <div className={`absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.08] select-none transform -rotate-45 z-0`}>
                    <span className={`text-[150px] font-black ${isPaid ? 'text-green-600' : 'text-red-600'} border-8 border-current px-12 py-4 rounded-xl`}>
                        {invoice.watermarkStatus}
                    </span>
                </div>

                {/* Header */}
                <div className="relative z-10 flex justify-between items-start mb-12 border-b-2 border-slate-900 pb-8">
                    <div>
                        {/* Branding */}
                        <div className="text-3xl font-black tracking-tighter text-slate-900 mb-2">ACHIERA</div>
                        <div className="text-sm text-slate-500 font-medium">Merchandise & IT Solutions</div>
                        <div className="mt-4 text-xs text-slate-400 max-w-[200px]">
                            Jl. Contoh No. 123, Jakarta Selatan<br />
                            support@achiera.com<br />
                            +62 812 3456 7890
                        </div>
                    </div>
                    <div className="text-right">
                        <h1 className="text-4xl font-light text-slate-300 mb-4 tracking-widest">INVOICE</h1>
                        <div className="space-y-1">
                            <div className="text-sm font-bold text-slate-900">NO: {invoice.invoiceNumber}</div>
                            <div className="text-sm text-slate-500">Date: {format(invoice.createdAt, 'dd MMM yyyy')}</div>
                            <div className="text-sm text-red-500 font-semibold">Due: {format(invoice.dueDate, 'dd MMM yyyy')}</div>
                        </div>
                    </div>
                </div>

                {/* Customer Info */}
                <div className="relative z-10 mb-12 grid grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To</h3>
                        <div className="text-lg font-bold text-slate-900">{invoice.order.customerName}</div>
                        <div className="text-sm text-slate-600">{invoice.order.customerEmail}</div>
                        <div className="text-sm text-slate-600">{invoice.order.customerPhone}</div>
                        <div className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{invoice.order.customerAddress || '-'}</div>
                    </div>
                    <div className="text-right">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Method</h3>
                        <div className="font-bold text-slate-900">{invoice.paymentMethod || 'Manual Transfer'}</div>
                        <div className="text-sm text-slate-500 mt-1">Status: <span className={isPaid ? 'text-green-600 font-bold' : 'text-amber-600 font-bold'}>{invoice.paymentStatus}</span></div>
                    </div>
                </div>

                {/* Table */}
                <div className="relative z-10 mb-12">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="text-left py-3 px-2 text-xs font-bold text-slate-500 uppercase">Item Description</th>
                                <th className="text-right py-3 px-2 text-xs font-bold text-slate-500 uppercase">Qty</th>
                                <th className="text-right py-3 px-2 text-xs font-bold text-slate-500 uppercase">Price</th>
                                <th className="text-right py-3 px-2 text-xs font-bold text-slate-500 uppercase">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.order.orderItems.map((item) => (
                                <tr key={item.id} className="border-b border-slate-50">
                                    <td className="py-4 px-2">
                                        <div className="font-bold text-slate-900">{item.name}</div>
                                        <div className="text-xs text-slate-500">{item.variantName}</div>
                                    </td>
                                    <td className="text-right py-4 px-2 text-slate-700">{item.quantity}</td>
                                    <td className="text-right py-4 px-2 text-slate-700">Rp {Number(item.price).toLocaleString()}</td>
                                    <td className="text-right py-4 px-2 font-bold text-slate-900">Rp {Number(item.subtotal).toLocaleString()}</td>
                                </tr>
                            ))}
                            {/* Fallback for legacy orders with no items */}
                            {invoice.order.orderItems.length === 0 && (
                                <tr className="border-b border-slate-50">
                                    <td className="py-4 px-2">
                                        <div className="font-bold text-slate-900">Custom Order Product</div>
                                        <div className="text-xs text-slate-500">Legacy Item</div>
                                    </td>
                                    <td className="text-right py-4 px-2 text-slate-700">{invoice.order.quantity}</td>
                                    <td className="text-right py-4 px-2 text-slate-700">-</td>
                                    <td className="text-right py-4 px-2 font-bold text-slate-900">Rp {Number(invoice.totalAmount).toLocaleString()}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Totals & QR */}
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-12">

                    {/* QR Section */}
                    <div className="flex gap-8">
                        {qrPayment && (
                            <div className="text-center">
                                <img src={qrPayment} alt="Payment QR" className="w-24 h-24 border border-slate-200 mb-2" />
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Scan to Pay</div>
                            </div>
                        )}
                        {qrTracking && (
                            <div className="text-center">
                                <img src={qrTracking} alt="Tracking QR" className="w-24 h-24 border border-slate-200 mb-2" />
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tracking</div>
                            </div>
                        )}
                    </div>

                    {/* Amount Section */}
                    <div className="w-full md:w-80">
                        <div className="flex justify-between py-2 border-b border-slate-100 text-slate-600">
                            <span>Subtotal</span>
                            <span>Rp {Number(invoice.totalAmount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100 text-slate-600">
                            <span>Tax (0%)</span>
                            <span>Rp 0</span>
                        </div>
                        <div className="flex justify-between py-4 text-xl font-black text-slate-900">
                            <span>TOTAL</span>
                            <span>Rp {Number(invoice.totalAmount).toLocaleString()}</span>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg mt-4 border border-slate-100">
                            <div className="flex justify-between text-sm font-bold text-slate-700 mb-1">
                                <span>Min. DP (50%)</span>
                                <span>Rp {(Number(invoice.totalAmount) * 0.5).toLocaleString()}</span>
                            </div>
                            <div className="text-xs text-slate-400 text-right">Required to process order</div>
                        </div>
                    </div>
                </div>

                {/* Footer Terms */}
                <div className="relative z-10 mt-16 pt-8 border-t border-slate-100 text-xs text-slate-400 space-y-1">
                    <h4 className="font-bold text-slate-500 mb-2">TERMS & CONDITIONS</h4>
                    <ul className="list-disc pl-4 space-y-1">
                        <li>Pembayaran minimal DP 50%.</li>
                        <li>Pesanan mulai diproses setelah pembayaran terverifikasi.</li>
                        <li>Waktu produksi mengikuti antrian 3–7 hari kerja.</li>
                        <li>Pembatalan setelah produksi dimulai tidak dapat refund.</li>
                        <li>Kesalahan desain dari customer bukan tanggung jawab kami.</li>
                        <li>Estimasi produksi dapat berubah sesuai antrean.</li>
                    </ul>
                </div>


            </div>

            <StylePrintButton />
        </div>
    );
}

// Small Client Component for Print Button

