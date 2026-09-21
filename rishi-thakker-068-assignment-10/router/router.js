const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const auth = require("../middleware/auth");

// ---------- AUTH ----------

router.post("/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.status(201).json({
      message: "Registered successfully. Check your email if confirmation is enabled.",
      user: data.user,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return res.status(401).json({ message: error.message });
    }

    res.status(200).json({
      message: "Login successful",
      access_token: data.session.access_token,
      user: data.user,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ---------- VEHICLES ----------

router.get("/vehicles", async (req, res) => {
  try {
    let query = supabase.from("vehicles").select("*");

    if (req.query.category) {
      query = query.eq("category", req.query.category);
    }
    if (req.query.status) {
      query = query.eq("status", req.query.status);
    }

    const { data, error } = await query.order("id", { ascending: true });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/vehicles/:id", async (req, res) => {
  try {
    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicles")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (vehicleError || !vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    const { data: pastRentals, error: rentalsError } = await supabase
      .from("rentals")
      .select("*")
      .eq("vehicle_id", req.params.id)
      .order("start_date", { ascending: false });

    if (rentalsError) {
      return res.status(400).json({ message: rentalsError.message });
    }

    res.status(200).json({ ...vehicle, rentalHistory: pastRentals });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post("/vehicles", auth, async (req, res) => {
  try {
    const { brand, model, year, category, daily_rate, fuel_type, seating_capacity } = req.body;

    if (!brand || !model || !year || !category || !daily_rate || !fuel_type) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const { data, error } = await supabase
      .from("vehicles")
      .insert([{ brand, model, year, category, daily_rate, fuel_type, seating_capacity }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.put("/vehicles/:id", auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("vehicles")
      .update(req.body)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.delete("/vehicles/:id", auth, async (req, res) => {
  try {
    const { data: activeBookings, error: checkError } = await supabase
      .from("rentals")
      .select("id")
      .eq("vehicle_id", req.params.id)
      .in("status", ["booked", "active"]);

    if (checkError) {
      return res.status(400).json({ message: checkError.message });
    }

    if (activeBookings && activeBookings.length > 0) {
      return res.status(400).json({ message: "Vehicle has active bookings and cannot be deleted" });
    }

    const { error } = await supabase.from("vehicles").delete().eq("id", req.params.id);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.status(200).json({ message: "Vehicle deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ---------- RENTALS ----------

router.post("/rentals", auth, async (req, res) => {
  try {
    const { vehicle_id, start_date, end_date, customer_name, customer_email } = req.body;

    if (!vehicle_id || !start_date || !end_date || !customer_name || !customer_email) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ message: "end_date cannot be before start_date" });
    }

    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicles")
      .select("*")
      .eq("id", vehicle_id)
      .single();

    if (vehicleError || !vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    if (vehicle.status === "maintenance") {
      return res.status(400).json({ message: "Vehicle is under maintenance and cannot be booked" });
    }

    // Collision check: any existing booked/active rental for this vehicle
    // whose range overlaps the requested [start_date, end_date].
    const { data: collisions, error: collisionError } = await supabase
      .from("rentals")
      .select("id")
      .eq("vehicle_id", vehicle_id)
      .in("status", ["booked", "active"])
      .lte("start_date", end_date)
      .gte("end_date", start_date);

    if (collisionError) {
      return res.status(400).json({ message: collisionError.message });
    }

    if (collisions && collisions.length > 0) {
      return res.status(400).json({ message: "Vehicle already reserved during this timeframe" });
    }

    const days = Math.max(
      1,
      Math.round((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24))
    );
    const total_cost = days * Number(vehicle.daily_rate);

    const { data: rental, error: rentalError } = await supabase
      .from("rentals")
      .insert([
        {
          user_id: req.user.id,
          vehicle_id,
          customer_name,
          customer_email,
          start_date,
          end_date,
          total_cost,
          status: "booked",
        },
      ])
      .select()
      .single();

    if (rentalError) {
      return res.status(400).json({ message: rentalError.message });
    }

    await supabase.from("vehicles").update({ status: "rented" }).eq("id", vehicle_id);

    res.status(201).json(rental);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/rentals/my-bookings", auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("rentals")
      .select("*, vehicles(brand, model, category, daily_rate)")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.patch("/rentals/:id/cancel", auth, async (req, res) => {
  try {
    const { data: rental, error: fetchError } = await supabase
      .from("rentals")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (fetchError || !rental) {
      return res.status(404).json({ message: "Rental not found" });
    }

    if (rental.status !== "booked" || new Date(rental.start_date) <= new Date()) {
      return res.status(400).json({ message: "Cannot cancel this rental" });
    }

    const { data, error } = await supabase
      .from("rentals")
      .update({ status: "cancelled" })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    await supabase.from("vehicles").update({ status: "available" }).eq("id", rental.vehicle_id);

    res.status(200).json({ message: "Rental cancelled successfully", rental: data });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.patch("/rentals/:id/complete", auth, async (req, res) => {
  try {
    const { data: rental, error: fetchError } = await supabase
      .from("rentals")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (fetchError || !rental) {
      return res.status(404).json({ message: "Rental not found" });
    }

    const { data, error } = await supabase
      .from("rentals")
      .update({ status: "completed" })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    await supabase.from("vehicles").update({ status: "available" }).eq("id", rental.vehicle_id);

    res.status(200).json({ message: "Rental marked as completed", rental: data });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
