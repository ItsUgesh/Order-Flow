"use client";

import { format } from 'date-fns';

interface ReceiptProps {
  order: any;
}

export default function PrintableReceipt({ order }: ReceiptProps) {
  return (
    <div 
      id="receipt-print-area" 
      className="overflow-hidden h-0"
      style={{ visibility: 'hidden' }}
    >
      {order ? (
        <div className="p-4 w-[88mm] bg-white text-black font-mono">
          <div className="text-center mb-4">
            <h1 className="text-lg font-bold uppercase">JP Food And Tandoori</h1>
            <p>Tel: 000-000-0000</p>
            <p className="border-b border-black border-dashed my-2">================================</p>
          </div>

          <div className="space-y-1 mb-4">
            <div className="flex justify-between">
              <span>Date: {format(new Date(), 'dd/MM/yyyy')}</span>
              <span>Time: {format(new Date(), 'HH:mm')}</span>
            </div>
            <p>Order #: {order.orderNumber}</p>
            <p>Type: {order.type === 'dine_in' ? 'Dine-in' : 'Takeaway'}</p>
            {order.tableNumber && <p>Table: {order.tableNumber}</p>}
            <p className="border-b border-black border-dashed my-2">--------------------------------</p>
          </div>

          <table className="w-full mb-4">
            <thead>
              <tr className="text-left border-b border-black border-dashed">
                <th className="pb-1">Item Name</th>
                <th className="pb-1 text-center">Qty</th>
                <th className="pb-1 text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td className="py-1">{item.name}</td>
                  <td className="py-1 text-center">{item.quantity}</td>
                  <td className="py-1 text-right">Rs {item.price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-1 mb-4 border-t border-black border-dashed pt-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>Rs {order.subtotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm">
              <span>Total:</span>
              <span>Rs {order.total?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between capitalize">
              <span>Payment:</span>
              <span>{order.paymentMethod || 'N/A'}</span>
            </div>
            <p className="border-b border-black border-dashed my-2">--------------------------------</p>
          </div>

          <div className="text-center">
            <p>Thank you for your visit!</p>
            <p>Please come again :)</p>
            <p className="mt-2">================================</p>
          </div>
        </div>
      ) : (
        <div className="w-[88mm] h-1" />
      )}
    </div>
  );
}
