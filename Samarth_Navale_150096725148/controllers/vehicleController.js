const { memoryVehicles, memoryRentals } = require('../config/store');

const getVehicles = async (req, res, next) => {
  try {
    const { category, status } = req.query;
    let list = [...memoryVehicles];

    if (category) {
      list = list.filter((v) => v.category.toLowerCase() === category.toLowerCase());
    }
    if (status) {
      list = list.filter((v) => v.status.toLowerCase() === status.toLowerCase());
    }

    return res.status(200).json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (err) {
    next(err);
  }
};

const getVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const v = memoryVehicles.find((item) => String(item.id) === String(id));

    if (!v) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const pastRentals = memoryRentals.filter((r) => String(r.vehicle_id) === String(id));

    return res.status(200).json({
      success: true,
      data: {
        ...v,
        rentals: pastRentals
      }
    });
  } catch (err) {
    next(err);
  }
};

const addVehicle = async (req, res, next) => {
  try {
    const { brand, model, year, category, daily_rate, fuel_type, seating_capacity } = req.body;

    if (!brand || !model || !year || !category || !daily_rate || !fuel_type) {
      return res.status(400).json({ success: false, message: 'Missing required vehicle fields' });
    }

    const validCategories = ['Sedan', 'SUV', 'Luxury', 'Hatchback', 'Electric'];
    const matchedCategory = validCategories.find(
      (c) => c.toLowerCase() === category.toLowerCase()
    );

    if (!matchedCategory) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }

    const rateNum = Number(daily_rate);
    if (isNaN(rateNum) || rateNum <= 0) {
      return res.status(400).json({ success: false, message: 'Daily rate must be greater than 0' });
    }

    const newId = memoryVehicles.length > 0 ? Math.max(...memoryVehicles.map((v) => v.id)) + 1 : 1;

    const v = {
      id: newId,
      brand: brand.trim(),
      model: model.trim(),
      year: Number(year),
      category: matchedCategory,
      daily_rate: rateNum,
      fuel_type: fuel_type.trim(),
      seating_capacity: Number(seating_capacity) || 5,
      status: 'available',
      created_at: new Date().toISOString()
    };

    memoryVehicles.push(v);

    return res.status(201).json({
      success: true,
      message: 'Vehicle added successfully',
      data: v
    });
  } catch (err) {
    next(err);
  }
};

const updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { daily_rate, status, category, seating_capacity } = req.body;

    const v = memoryVehicles.find((item) => String(item.id) === String(id));
    if (!v) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    if (daily_rate !== undefined) {
      const rateNum = Number(daily_rate);
      if (isNaN(rateNum) || rateNum <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid daily rate' });
      }
      v.daily_rate = rateNum;
    }

    if (status !== undefined) {
      const validStatuses = ['available', 'rented', 'maintenance'];
      if (!validStatuses.includes(status.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }
      v.status = status.toLowerCase();
    }

    if (category !== undefined) {
      const validCategories = ['Sedan', 'SUV', 'Luxury', 'Hatchback', 'Electric'];
      const matched = validCategories.find((c) => c.toLowerCase() === category.toLowerCase());
      if (matched) v.category = matched;
    }

    if (seating_capacity !== undefined) {
      v.seating_capacity = Number(seating_capacity) || v.seating_capacity;
    }

    return res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      data: v
    });
  } catch (err) {
    next(err);
  }
};

const deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idx = memoryVehicles.findIndex((item) => String(item.id) === String(id));

    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const activeBookings = memoryRentals.filter(
      (r) => String(r.vehicle_id) === String(id) && ['booked', 'active'].includes(r.status)
    );

    if (activeBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete vehicle with active or upcoming bookings'
      });
    }

    const [deleted] = memoryVehicles.splice(idx, 1);

    return res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully',
      data: deleted
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getVehicles,
  getVehicleById,
  addVehicle,
  updateVehicle,
  deleteVehicle
};
