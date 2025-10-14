const Report = require('../models/Report');
const Contract = require('../models/Contract'); // Asegúrate de que la ruta sea correcta

// Crear un nuevo reporte
exports.createReport = async (req, res) => {
  try {
    const { title, description, type } = req.body;
    const createdBy = req.userId;

    let data = req.body.data;

    // Si es un reporte de contratos, traer los contratos desde la base de datos
    if (type === 'contract') {
      data = await Contract.find(); // Puedes usar .lean() si quieres un resultado más liviano
    }

    const newReport = new Report({ title, description, type, data, createdBy });
    await newReport.save();

    res.status(201).json({
      success: true,
      message: 'Reporte creado correctamente',
      data: newReport
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear reporte',
      error: error.message
    });
  }
};


// Obtener todos los reportes
exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.find().populate('createdBy', 'name');
    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener reportes', error: error.message });
  }
};

// Obtener un reporte por ID
exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Reporte no encontrado' });

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener reporte', error: error.message });
  }
};

// Actualizar un reporte
exports.updateReport = async (req, res) => {
  try {
    const updated = await Report.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Reporte no encontrado' });

    res.status(200).json({ success: true, message: 'Reporte actualizado', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar reporte', error: error.message });
  }
};

// Eliminar un reporte
exports.deleteReport = async (req, res) => {
  try {
    const deleted = await Report.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Reporte no encontrado' });

    res.status(200).json({ success: true, message: 'Reporte eliminado' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar reporte', error: error.message });
  }
};
