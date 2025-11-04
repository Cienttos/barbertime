import {
  getBarberAvailability as getBarberAvailabilityFromService,
  getAvailableSlots as getAvailableSlotsFromService,
  updateBarberAvailability as updateBarberAvailabilityFromService,
} from "../services/barber.service.js";

// @route   GET /api/barbers/:barberId/availability
// @access  Public
export const getBarberAvailability = async (req, res) => {
  const { barberId } = req.params;
  try {
    const availability = await getBarberAvailabilityFromService(barberId);
    res.status(200).json(availability);
  } catch (error) {
    if (error.message === "Availability not found for this barber.") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get available time slots for a barber on a specific date for a given service
export const getAvailableSlots = async (req, res) => {
  const { barberId } = req.params;
  const { date, serviceId } = req.query; // date in "YYYY-MM-DD" format

  if (!date || !serviceId) {
    return res
      .status(400)
      .json({ message: "Date and Service ID are required." });
  }
  try {
    const availableSlots = await getAvailableSlotsFromService(
      barberId,
      date,
      serviceId
    );
    res.status(200).json(availableSlots);
  } catch (error) {
    if (
      error.message === "Service not found." ||
      error.message === "Barber not found."
    ) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get availability for the authenticated barber
export const getAuthenticatedBarberAvailability = async (req, res) => {
  const barberId = req.user.id; // Assuming req.user.id is set by protect middleware
  try {
    const availability = await getBarberAvailabilityFromService(barberId);
    res.status(200).json(availability);
  } catch (error) {
    if (error.message === "Availability not found for this barber.") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new availability for the authenticated barber
// Esto se maneja con la función de actualizar, ya que se modifica un campo JSONB.
export const createBarberAvailability = async (req, res) => {
  return updateBarberAvailability(req, res);
};

// @desc    Update availability for the authenticated barber
export const updateBarberAvailability = async (req, res) => {
  const barberId = req.user.id;
  const newAvailability = req.body; // Espera el objeto de disponibilidad completo
  try {
    const updatedAvailability = await updateBarberAvailabilityFromService(
      barberId,
      newAvailability
    );
    res.status(200).json(updatedAvailability);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete availability for the authenticated barber
export const deleteBarberAvailability = async (req, res) => {
  // Para eliminar, simplemente se envía un objeto vacío al endpoint de actualización.
  req.body = {};
  return updateBarberAvailability(req, res);
};
