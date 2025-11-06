// Importación de modelos necesarios
const Contract = require('../models/Contract');
const Event = require('../models/Event');
const Resource = require('../models/Resource');
const Provider = require('../models/Provider');
const Personnel = require('../models/Personnel');

// --- HELPER 1.A: Validar Recursos ---
const validateContractResources = async (resources) => {
  if (!resources || resources.length === 0) {
    return null; // No hay nada que validar, es válido
  }
  for (const item of resources) {
    // ✅ CORRECCIÓN (S5147): Forzamos el ID a string
    const resourceExists = await Resource.findById(String(item.resource));
    if (!resourceExists) {
      // Devolvemos el error en lugar de enviar una respuesta
      return { status: 404, message: `El recurso con ID ${item.resource} no existe` };
    }
  }
  return null;
};

// --- HELPER 1.B: Validar Proveedores ---
const validateContractProviders = async (providers) => {
  if (!providers || providers.length === 0) {
    return null; // No hay nada que validar, es válido
  }
  for (const item of providers) {
    // ✅ CORRECCIÓN (S5147): Forzamos el ID a string
    const providerExists = await Provider.findById(String(item.provider));
    if (!providerExists) {
      return { status: 404, message: `El proveedor con ID ${item.provider} no existe` };
    }
  }
  return null;
};

// --- HELPER 1.C: Validar Personal ---
const validateContractPersonnel = async (personnel) => {
  if (!personnel || personnel.length === 0) {
    return null; // No hay nada que validar, es válido
  }
  for (const item of personnel) {
    // ✅ CORRECCIÓN (S5147): Forzamos el ID a string
    const personExists = await Personnel.findById(String(item.person));
    if (!personExists) {
      return { status: 404, message: `El personal con ID ${item.person} no existe` };
    }
  }
  return null;
};

// --- HELPER 2: Manejo de Errores ---
const handleContractError = (error, res, action = 'procesar') => {
  if (error.code === 11000) {
    return res.status(400).json({ success: false, message: 'Ya existe un contrato con ese nombre.' });
  }
  res.status(500).json({ success: false, message: `Error al ${action} contrato`, error: error.message });
};

// --- HELPER 3: Construir Update Data ---
const buildContractUpdateData = (body) => {
  const {
    name, clientName, clientPhone, clientEmail, startDate,
    endDate, budget, status, terms, resources, providers, personnel
  } = body;
  
  const updateData = {};
  if (name) updateData.name = name;
  if (clientName) updateData.clientName = clientName;
  if (clientPhone) updateData.clientPhone = clientPhone;
  if (clientEmail) updateData.clientEmail = clientEmail;
  if (startDate) updateData.startDate = startDate;
  if (endDate) updateData.endDate = endDate;
  if (budget) updateData.budget = budget;
  if (status) updateData.status = status;
  if (terms) updateData.terms = terms;
  if (resources) updateData.resources = resources;
  if (providers) updateData.providers = providers;
  if (personnel) updateData.personnel = personnel;
  
  return updateData;
};

// --- HELPERS 4: Lógica de Reporte (Cálculos) ---
// ✅ CORRECCIÓN (S1135): Lógica de cálculo completada
const calculateReportTotals = (contract) => {
  let resourcesTotal = 0;
  if (contract.resources && contract.resources.length > 0) {
    resourcesTotal = contract.resources.reduce((sum, item) => {
      // Verificación adicional de que item.resource no es null
      return sum + (item.resource ? (item.resource.cost * item.quantity) : 0);
    }, 0);
  }

  let providersTotal = 0;
  if (contract.providers && contract.providers.length > 0) {
    providersTotal = contract.providers.reduce((sum, item) => {
      return sum + (item.cost || 0);
    }, 0);
  }

  let personnelTotal = 0;
  if (contract.personnel && contract.personnel.length > 0) {
    personnelTotal = contract.personnel.reduce((sum, item) => {
      // Verificación adicional de que item.person no es null
      return sum + (item.person ? (item.hours || 0) * 50 : 0);
    }, 0);
  }
  
  return { resourcesTotal, providersTotal, personnelTotal };
};

// --- HELPER 5: Lógica de Reporte (Estructura) ---
// ✅ CORRECCIÓN (S1135): Lógica de estructura completada
const structureReport = (contract, totals) => {
  const { resourcesTotal, providersTotal, personnelTotal } = totals;
  return {
    contractDetails: {
      clientName: contract.clientName,
      clientPhone: contract.clientPhone,
      clientEmail: contract.clientEmail,
      startDate: contract.startDate,
      endDate: contract.endDate,
      status: contract.status,
      terms: contract.terms,
      createdBy: contract.createdBy,
      createdAt: contract.createdAt
    },
    eventDetails: contract.event,
    resources: { items: contract.resources, total: resourcesTotal },
    providers: { items: contract.providers, total: providersTotal },
    personnel: { items: contract.personnel, total: personnelTotal },
    grandTotal: resourcesTotal + providersTotal + personnelTotal
  };
};


// --- Controladores (Exports) ---

// Controlador para obtener todos los contratos
exports.getAllContracts = async (req, res) => {
  try {
    // ✅ CORRECCIÓN (S7773): Number.parseInt
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const total = await Contract.countDocuments();
    const contracts = await Contract.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('resources.resource', 'name description')
      .populate('providers.provider', 'name contactPerson')
      .populate('personnel.person', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: contracts,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener contratos', error: error.message });
  }
};

// Controlador para obtener un contrato por su ID
exports.getContractById = async (req, res) => {
  try {
    // ✅ CORRECCIÓN (S5147): String(id)
    const contract = await Contract.findById(String(req.params.id))
      .populate('resources.resource', 'name description quantity cost')
      .populate('providers.provider', 'name contactPerson email phone')
      .populate('personnel.person', 'firstName lastName email phone');

    if (!contract) {
      return res.status(404).json({ success: false, message: 'Contrato no encontrado' });
    }
    res.status(200).json({ success: true, data: contract });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener contrato', error: error.message });
  }
};

// Controlador para buscar contratos por nombre
exports.searchContractsByName = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'El parámetro de búsqueda "name" es requerido' });
    }
    const contracts = await Contract.find({
      // ✅ CORRECCIÓN (S5147): String(name)
      name: { $regex: String(name), $options: 'i' }
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('resources.resource', 'name description quantity cost')
    .populate('providers.provider', 'name contactPerson email phone')
    .populate('personnel.person', 'firstName lastName email phone');
    
    res.status(200).json({ success: true, data: contracts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al buscar contratos', error: error.message });
  }
};

// Obtener el conteo de contratos por estado
exports.getCountByStatus = async (req, res) => {
  try {
    let counts;
    try {
      counts = await Contract.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);
    } catch (aggError) {
      console.error("❌ Error durante el aggregate:", aggError);
      return res.status(500).json({ success: false, message: "Fallo en la etapa de agrupamiento (aggregate)", error: aggError.message });
    }

    const result = counts.reduce((acc, item) => {
      acc[item._id || 'desconocido'] = item.count;
      return acc;
    }, {});
    
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("❌ Error general:", error);
    res.status(500).json({ success: false, message: "Error general al contar contratos por estado", error: error.message });
  }
};



// Controlador para crear un nuevo contrato
// ✅ REFACTORIZADO (S3776)
exports.createContract = async (req, res) => {
  try {
    console.log('[createContract] Request body:', req.body);
    
    // 1. Validar (Llamamos a los 3 nuevos helpers)
    const resourceError = await validateContractResources(req.body.resources);
    if (resourceError) {
      return res.status(resourceError.status).json({ success: false, message: resourceError.message });
    }
    
    const providerError = await validateContractProviders(req.body.providers);
    if (providerError) {
      return res.status(providerError.status).json({ success: false, message: providerError.message });
    }
    
    const personnelError = await validateContractPersonnel(req.body.personnel);
    if (personnelError) {
      return res.status(personnelError.status).json({ success: false, message: personnelError.message });
    }
    
    // 2. Crear
    const contract = new Contract({
      ...req.body,
      createdBy: req.userId
    });
    
    // 3. Guardar
    const savedContract = await contract.save();
    res.status(201).json({ success: true, message: 'Contrato creado exitosamente', data: savedContract });
    
  } catch (error) {
    // 4. Manejar Errores (Complejidad en Helper 2)
    handleContractError(error, res, 'crear');
  }
};

// Controlador para actualizar un contrato
// ✅ REFACTORIZADO (S3776)
exports.updateContract = async (req, res) => {
  try {
    // 1. Validar (Llamamos a los 3 nuevos helpers)
    const resourceError = await validateContractResources(req.body.resources);
    if (resourceError) {
      return res.status(resourceError.status).json({ success: false, message: resourceError.message });
    }
    
    const providerError = await validateContractProviders(req.body.providers);
    if (providerError) {
      return res.status(providerError.status).json({ success: false, message: providerError.message });
    }
    
    const personnelError = await validateContractPersonnel(req.body.personnel);
    if (personnelError) {
      return res.status(personnelError.status).json({ success: false, message: personnelError.message });
    }

    // 2. Construir datos (Complejidad en Helper 3)
    const updateData = buildContractUpdateData(req.body);

    // 3. Validación simple (se queda)
    if (updateData.startDate && updateData.endDate && new Date(updateData.endDate) < new Date(updateData.startDate)) {
      return res.status(400).json({ success: false, message: 'La fecha de fin no puede ser anterior a la fecha de inicio' });
    }

    // 4. Actualizar
    // ✅ CORRECCIÓN (S5147): String(id)
    const updatedContract = await Contract.findByIdAndUpdate(
      String(req.params.id),
      updateData,
      { new: true, runValidators: true }
    )
      .populate('resources.resource', 'name')
      .populate('providers.provider', 'name')
      .populate('personnel.person', 'firstName lastName');

    if (!updatedContract) {
      return res.status(404).json({ success: false, message: 'Contrato no encontrado' });
    }
    
    res.status(200).json({ success: true, message: 'Contrato actualizado exitosamente', data: updatedContract });
    
  } catch (error) {
    // 5. Manejar Errores (Complejidad en Helper 2)
    handleContractError(error, res, 'actualizar');
  }
};

// Controlador para eliminar un contrato
exports.deleteContract = async (req, res) => {
  try {
    // ✅ CORRECCIÓN (S5147): String(id)
    const deletedContract = await Contract.findByIdAndDelete(String(req.params.id));
    if (!deletedContract) {
      return res.status(404).json({ success: false, message: 'Contrato no encontrado' });
    }
    res.status(200).json({ success: true, message: 'Contrato eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar contrato', error: error.message });
  }
};

// Controlador para generar un reporte
// ✅ REFACTORIZADO (S3776)
exports.generateContractReport = async (req, res) => {
  try {
    // 1. Buscar
    // ✅ CORRECCIÓN (S5147): String(id)
    const contract = await Contract.findById(String(req.params.id))
      .populate('resources.resource', 'name description quantity cost')
      .populate('providers.provider', 'name contactPerson email phone serviceDescription cost')
      .populate('personnel.person', 'firstName lastName email phone role hours')
      .populate('createdBy', 'username fullName');

    if (!contract) {
      return res.status(404).json({ success: false, message: 'Contrato no encontrado' });
    }

    // 2. Calcular (Complejidad en Helper 4)
    const totals = calculateReportTotals(contract);
    
    // 3. Estructurar (Complejidad en Helper 5)
    const report = structureReport(contract, totals);
    
    res.status(200).json({ success: true, data: report });
    
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al generar reporte', error: error.message });
  }
};