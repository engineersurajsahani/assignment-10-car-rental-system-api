const { memoryVehicles, memoryRentals } = require('../config/store');

const bookRental = async (req, res, next) => {
  try {
    const { vehicle_id, start_date, end_date, customer_name, customer_email } = req.body;

    if (!vehicle_id || !start_date || !end_date || !customer_name || !customer_email) {
      return res.status(400).json({ success: false, message: 'All booking fields are required' });
    }

    const v = memoryVehicles.find((item) => String(item.id) === String(vehicle_id));
    if (!v) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    if (v.status === 'maintenance') {
      return res.status(400).json({ success: false, message: 'Vehicle is currently under maintenance' });
    }

    const reqStart = new Date(start_date);
    const reqEnd = new Date(end_date);

    if (isNaN(reqStart.getTime()) || isNaN(reqEnd.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid start or end date format' });
    }

    if (reqEnd < reqStart) {
      return res.status(400).json({ success: false, message: 'End date must be greater than or equal to start date' });
    }

    const collision = memoryRentals.find((r) => {
      if (String(r.vehicle_id) !== String(vehicle_id)) return false;
      if (!['booked', 'active'].includes(r.status)) return false;

      const curStart = new Date(r.start_date);
      const curEnd = new Date(r.end_date);

      return reqStart <= curEnd && reqEnd >= curStart;
    });

    if (collision) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle already reserved during this timeframe'
      });
    }

    const diffMs = reqEnd.getTime() - reqStart.getTime();
    const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const total_cost = days * v.daily_rate;

    const newId = memoryRentals.length > 0 ? Math.max(...memoryRentals.map((r) => r.id)) + 1 : 1;

    const rental = {
      id: newId,
      user_id: req.user ? req.user.id : 'anonymous',
      vehicle_id: v.id,
      customer_name: customer_name.trim(),
      customer_email: customer_email.trim().toLowerCase(),
      start_date,
      end_date,
      days,
      total_cost,
      status: 'booked',
      created_at: new Date().toISOString()
    };

    memoryRentals.push(rental);

    return res.status(201).json({
      success: true,
      message: 'Rental booked successfully',
      data: rental
    });
  } catch (err) {
    next(err);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email ? req.user.email.toLowerCase() : '';

    const list = memoryRentals
      .filter((r) => r.user_id === userId || (userEmail && r.customer_email === userEmail))
      .map((r) => {
        const v = memoryVehicles.find((item) => String(item.id) === String(r.vehicle_id));
        return {
          ...r,
          vehicle: v || null
        };
      });

    return res.status(200).json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (err) {
    next(err);
  }
};

const cancelRental = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rental = memoryRentals.find((r) => String(r.id) === String(id));

    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental not found' });
    }

    if (rental.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Rental is already cancelled' });
    }

    if (rental.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a completed rental' });
    }

    rental.status = 'cancelled';

    return res.status(200).json({
      success: true,
      message: 'Rental cancelled successfully',
      data: rental
    });
  } catch (err) {
    next(err);
  }
};

const completeRental = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rental = memoryRentals.find((r) => String(r.id) === String(id));

    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental not found' });
    }

    rental.status = 'completed';

    const v = memoryVehicles.find((item) => String(item.id) === String(rental.vehicle_id));
    if (v) {
      v.status = 'available';
    }

    return res.status(200).json({
      success: true,
      message: 'Rental marked as completed, vehicle returned to available status',
      data: rental
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  bookRental,
  getMyBookings,
  cancelRental,
  completeRental
};
