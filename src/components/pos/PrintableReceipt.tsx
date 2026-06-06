"use client";

import { format } from 'date-fns';

interface ReceiptProps {
  order: any;
}

export default function PrintableReceipt({ order }: ReceiptProps) {
  return (
    <div
      id="receipt-print-area"
      style={{
        position: 'fixed',
        top: '-9999px',
        left: '-9999px',
        width: '88mm',
        fontFamily: 'Courier New, Courier, monospace',
        fontSize: '12px',
        lineHeight: '1.4',
        color: '#000',
        backgroundColor: '#fff',
        padding: '16px',
      }}
    >
      {order ? (
        <>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <p style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>Order Flow</p>
            <p>Tel: 15927873</p>
            <p style={{ borderBottom: '1px dashed black', marginBottom: '8px', paddingBottom: '8px' }}>
              ================================
            </p>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Date: {format(new Date(), 'dd/MM/yyyy')}</span>
              <span>Time: {format(new Date(), 'HH:mm')}</span>
            </div>
            <p>Order #: {order.orderNumber}</p>
            <p>Type: {order.type === 'dine_in' ? 'Dine-in' : 'Takeaway'}</p>
            {order.tableNumber && <p>Table: {order.tableNumber}</p>}
            <p style={{ borderBottom: '1px dashed black', margin: '8px 0' }}>
              --------------------------------
            </p>
          </div>

          <table style={{ width: '100%', marginBottom: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px dashed black' }}>
                <th style={{ textAlign: 'left', paddingBottom: '4px' }}>Item Name</th>
                <th style={{ textAlign: 'center', paddingBottom: '4px' }}>Qty</th>
                <th style={{ textAlign: 'right', paddingBottom: '4px' }}>Price</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td style={{ padding: '3px 0' }}>{item.name}</td>
                  <td style={{ textAlign: 'center', padding: '3px 0' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right', padding: '3px 0' }}>
                    Rs {(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: '1px dashed black', paddingTop: '8px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal:</span>
              <span>Rs {order.subtotal?.toFixed(2) ?? order.total?.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>Total:</span>
              <span>Rs {order.total?.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', textTransform: 'capitalize' }}>
              <span>Payment:</span>
              <span>{order.paymentMethod || 'N/A'}</span>
            </div>
            <p style={{ borderBottom: '1px dashed black', margin: '8px 0' }}>
              --------------------------------
            </p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <p>Thank you for your visit!</p>
            <p>Please come again :)</p>
            <p style={{ marginTop: '8px' }}>================================</p>
          </div>
        </>
      ) : (
        // Empty placeholder so the div always exists in DOM
        <div style={{ width: '1px', height: '1px' }} />
      )}
    </div>
  );
}