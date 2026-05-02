export function rideConfirmed(opts: { riderName: string; pickup: string; dropoff: string; fare: string; vehicleType: string }) {
  return {
    subject: 'Your Moove ride is confirmed',
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h1 style="color:#7B5EA7;margin-bottom:4px">Moove</h1>
      <h2 style="margin-top:0">Ride Confirmed</h2>
      <p>Hi ${opts.riderName}, your ride has been booked.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px 0;color:#666">Pickup</td><td style="padding:8px 0;font-weight:600">${opts.pickup}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Dropoff</td><td style="padding:8px 0;font-weight:600">${opts.dropoff}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Vehicle</td><td style="padding:8px 0;text-transform:capitalize">${opts.vehicleType}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Est. Fare</td><td style="padding:8px 0;font-weight:600;color:#7B5EA7">${opts.fare}</td></tr>
      </table>
      <p style="color:#666;font-size:14px">We're finding your driver now. You'll be notified when one accepts.</p>
    </div>`,
  }
}

export function driverAssigned(opts: { riderName: string; driverName: string; vehicle: string; plate: string; rating: string }) {
  return {
    subject: `Your driver ${opts.driverName} is on the way`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h1 style="color:#7B5EA7;margin-bottom:4px">Moove</h1>
      <h2 style="margin-top:0">Driver Found</h2>
      <p>Hi ${opts.riderName}, your driver is on the way!</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px 0;color:#666">Driver</td><td style="padding:8px 0;font-weight:600">${opts.driverName}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Vehicle</td><td style="padding:8px 0">${opts.vehicle}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Plate</td><td style="padding:8px 0">${opts.plate}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Rating</td><td style="padding:8px 0">⭐ ${opts.rating}</td></tr>
      </table>
    </div>`,
  }
}

export function rideCompleted(opts: { riderName: string; pickup: string; dropoff: string; fare: string; distance: string }) {
  return {
    subject: `Your Moove ride receipt — ${opts.fare}`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h1 style="color:#7B5EA7;margin-bottom:4px">Moove</h1>
      <h2 style="margin-top:0">Trip Receipt</h2>
      <p>Thanks for riding with Moove, ${opts.riderName}!</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px 0;color:#666">From</td><td style="padding:8px 0">${opts.pickup}</td></tr>
        <tr><td style="padding:8px 0;color:#666">To</td><td style="padding:8px 0">${opts.dropoff}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Distance</td><td style="padding:8px 0">${opts.distance}</td></tr>
        <tr style="border-top:2px solid #7B5EA7"><td style="padding:12px 0;font-weight:700;font-size:18px">Total</td><td style="padding:12px 0;font-weight:700;font-size:18px;color:#7B5EA7">${opts.fare}</td></tr>
      </table>
    </div>`,
  }
}

export function driverApproved(opts: { driverName: string }) {
  return {
    subject: 'You\'re approved to drive with Moove!',
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h1 style="color:#7B5EA7;margin-bottom:4px">Moove</h1>
      <h2 style="margin-top:0">You're approved! 🎉</h2>
      <p>Hi ${opts.driverName}, your application has been approved.</p>
      <p>You can now go online and start accepting rides. Your first month is free — no fees on any rides during your trial.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/driver" style="display:inline-block;margin-top:16px;background:#7B5EA7;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Start Driving</a>
    </div>`,
  }
}

export function driverRejected(opts: { driverName: string; reason?: string }) {
  return {
    subject: 'Update on your Moove driver application',
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h1 style="color:#7B5EA7;margin-bottom:4px">Moove</h1>
      <h2 style="margin-top:0">Application Update</h2>
      <p>Hi ${opts.driverName}, unfortunately we're unable to approve your driver application at this time.</p>
      ${opts.reason ? `<p style="color:#666">${opts.reason}</p>` : ''}
      <p>If you believe this is an error or would like to reapply, please contact us at <a href="mailto:support@moove.app">support@moove.app</a>.</p>
    </div>`,
  }
}

export function payoutSent(opts: { driverName: string; amount: string; periodRides: number }) {
  return {
    subject: `Moove payout of ${opts.amount} is on the way`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h1 style="color:#7B5EA7;margin-bottom:4px">Moove</h1>
      <h2 style="margin-top:0">Payout Sent</h2>
      <p>Hi ${opts.driverName}, your payout has been initiated.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px 0;color:#666">Amount</td><td style="padding:8px 0;font-weight:700;font-size:20px;color:#7B5EA7">${opts.amount}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Rides</td><td style="padding:8px 0">${opts.periodRides}</td></tr>
        <tr><td style="padding:8px 0;color:#666">ETA</td><td style="padding:8px 0">1–2 business days</td></tr>
      </table>
      <p style="color:#666;font-size:14px">Funds will appear in your connected bank account via Stripe.</p>
    </div>`,
  }
}
