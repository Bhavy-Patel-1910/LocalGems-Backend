const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/Booking.model');

const createPaymentIntent = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.amountAgreed * 100), // paise/cents
      currency: 'inr',
      metadata: { bookingId: booking._id.toString() },
    });

    booking.stripePaymentIntentId = paymentIntent.id;
    await booking.save();

    res.json({ success: true, data: { clientSecret: paymentIntent.client_secret } });
  } catch (error) { next(error); }
};

const handleWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    await Booking.findOneAndUpdate(
      { stripePaymentIntentId: pi.id },
      { paymentStatus: 'paid', status: 'confirmed' }
    );
  }
  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object;
    await Booking.findOneAndUpdate({ stripePaymentIntentId: pi.id }, { paymentStatus: 'pending' });
  }

  res.json({ received: true });
};

module.exports = { createPaymentIntent, handleWebhook };
