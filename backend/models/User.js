// Importación de dependencias
const mongoose = require('mongoose'); // Para interactuar con MongoDB
const bcrypt = require('bcryptjs');   // Para el hashing de contraseñas

// Definición del esquema de usuario
const userSchema = new mongoose.Schema({
  // Campo 'document': Numero de documento unico y requerido
  document: {
    type: Number,
    required: true,
    unique: true,
    trim: true
  },
  // Campo 'fullName': nombre completo
  fullname: {
    type: String,
    required: true,
    trim: true
  },
  // Campo 'username': Nombre de usuario único y requerido
  username: {
    type: String,       // Tipo de dato: String
    required: true,     // Obligatorio
    unique: true,       // No puede haber duplicados
    trim: true          // Elimina espacios en blanco al inicio/final
  },
  // Campo 'email': Correo electrónico único y requerido
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true     // Guarda el email en minúsculas
  },
  // Campo 'password': Contraseña (no se incluye en consultas por defecto)
  password: {
    type: String,
    required: true,
    select: false       // No se devuelve en las consultas automáticamente
  },
  // Campo 'role': Define el rol del usuario con valores permitidos
  role: {
    type: String,
    enum: ['admin', 'coordinador', 'lider'], // Solo permite estos roles
    default: 'lider'    // Valor por defecto si no se especifica
  },
  active: {
    type: Boolean,
    default: true
  },
  // resetPasswordToken: String,       // No es required
  // resetPasswordExpires: Date 
}, { timestamps: true }); // Añade campos 'createdAt' y 'updatedAt' automáticamente

// Middleware (hook) que se ejecuta ANTES de guardar un usuario
userSchema.pre('save', async function(next) {
  // Solo hashea la contraseña si ha sido modificada (o es nueva)
  if (!this.isModified('password')) return next();
  
  try {
    // Genera un "salt" (valor aleatorio para fortalecer el hash)
    const salt = await bcrypt.genSalt(10);
    // Hashea la contraseña con el salt generado
    this.password = await bcrypt.hash(this.password, salt);
    next(); // Continúa con el proceso de guardado
  } catch (error) {
    next(error); // Maneja errores durante el hashing
  }
});

// Método personalizado para comparar contraseñas
userSchema.methods.comparePassword = async function(candidatePassword) {
  // Compara la contraseña proporcionada con la almacenada (hash)
  return await bcrypt.compare(candidatePassword, this.password);
};

// Exporta el modelo 'User' basado en el esquema definido
module.exports = mongoose.model('User', userSchema);