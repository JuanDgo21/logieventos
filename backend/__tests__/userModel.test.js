const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

describe('Pruebas Unitarias: Modelo de Usuario (User)', () => {
    
    // Configuración de DB en memoria o local para estas pruebas
    beforeAll(async () => {
        const testDB = 'mongodb://localhost:27017/logieventos_test_model_user';
        await mongoose.connect(testDB);
        await User.deleteMany({});
    });

    afterAll(async () => {
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    afterEach(async () => {
        // Limpiamos la colección después de cada test individual
        await User.deleteMany({});
    });

    const mockUser = {
        document: 12345678,
        fullname: "Test User Model",
        username: "modeluser",
        email: "model@test.com",
        password: "password123",
        role: "lider"
    };

    // =================================================================
    // 1. VALIDACIONES DE SCHEMA
    // =================================================================
    describe('Validaciones del Schema', () => {
        
        it('Debería crear un usuario correctamente con datos válidos', async () => {
            const user = new User(mockUser);
            const savedUser = await user.save();
            
            expect(savedUser._id).toBeDefined();
            expect(savedUser.username).toBe(mockUser.username);
            expect(savedUser.email).toBe(mockUser.email); // lowercase aplicado
            expect(savedUser.role).toBe(mockUser.role);
            expect(savedUser.active).toBe(true); // Valor por defecto
        });

        it('Error: Campos requeridos faltantes', async () => {
            const user = new User({}); // Objeto vacío
            
            let err;
            try {
                await user.save();
            } catch (error) {
                err = error;
            }

            expect(err).toBeDefined();
            expect(err.name).toBe('ValidationError');
            // Verificamos que falten los campos obligatorios
            expect(err.errors.document).toBeDefined();
            expect(err.errors.fullname).toBeDefined();
            expect(err.errors.username).toBeDefined();
            expect(err.errors.email).toBeDefined();
            expect(err.errors.password).toBeDefined();
        });

        it('Error: Rol inválido (Enum)', async () => {
            const user = new User({ ...mockUser, role: 'super_dios' });
            
            let err;
            try {
                await user.save();
            } catch (error) {
                err = error;
            }

            expect(err).toBeDefined();
            expect(err.errors.role).toBeDefined(); // Debe fallar por enum
        });

        it('Error: Duplicado de campo Unique (Email)', async () => {
            // Guardamos el primero
            await new User(mockUser).save();
            
            // Intentamos guardar otro con el mismo email (cambiando username/doc para aislar el error)
            const dupUser = new User({ 
                ...mockUser, 
                document: 99999999, 
                username: 'otheruser' 
            });
            
            let err;
            try {
                await dupUser.save();
            } catch (error) {
                err = error;
            }

            expect(err).toBeDefined();
            expect(err.code).toBe(11000); // Código de error de duplicado en MongoDB
        });
    });

    // =================================================================
    // 2. MIDDLEWARE PRE-SAVE (Hashing)
    // =================================================================
    describe('Middleware pre("save") - Hashing de Contraseña', () => {
        
        it('Debería hashear la contraseña al guardar un usuario nuevo', async () => {
            const user = new User(mockUser);
            const savedUser = await user.save();

            // La contraseña guardada NO debe ser igual a la original plana
            expect(savedUser.password).not.toBe(mockUser.password);
            // Debe tener formato de hash bcrypt (empieza con $2a$ o $2b$)
            expect(savedUser.password).toMatch(/^\$2[ayb]\$.{56}$/);
        });

        it('No debería re-hashear la contraseña si no se modificó', async () => {
            // 1. Guardar usuario original
            const user = new User(mockUser);
            const savedUser = await user.save();
            const originalHash = savedUser.password;

            // 2. Modificar otro campo (ej. fullname) pero NO password
            // NOTA: Debemos recuperar el documento de la DB para simular el flujo real
            // o usar la instancia que ya tenemos si Mongoose trackea los cambios.
            savedUser.fullname = "Updated Name";
            
            // Verificamos que Mongoose sepa que password NO se modificó
            expect(savedUser.isModified('password')).toBe(false);

            const updatedUser = await savedUser.save();

            // 3. El hash debe ser idéntico al original
            expect(updatedUser.password).toBe(originalHash);
        });

        it('Debería generar un nuevo hash si se cambia la contraseña', async () => {
            const user = new User(mockUser);
            const savedUser = await user.save();
            const originalHash = savedUser.password;

            // Cambiamos contraseña
            savedUser.password = "newpassword123";
            const updatedUser = await savedUser.save();

            expect(updatedUser.password).not.toBe(originalHash);
            expect(updatedUser.password).not.toBe("newpassword123");
            
            // Verificar que el nuevo hash sea válido para la nueva contraseña
            const match = await bcrypt.compare("newpassword123", updatedUser.password);
            expect(match).toBe(true);
        });
    });

    // =================================================================
    // 3. MÉTODOS DE INSTANCIA (comparePassword)
    // =================================================================
    describe('Método comparePassword', () => {
        
        it('Debería retornar true para la contraseña correcta', async () => {
            const user = new User(mockUser);
            await user.save(); // Se hashea al guardar

            const isMatch = await user.comparePassword(mockUser.password);
            expect(isMatch).toBe(true);
        });

        it('Debería retornar false para una contraseña incorrecta', async () => {
            const user = new User(mockUser);
            await user.save();

            const isMatch = await user.comparePassword("wrongpassword");
            expect(isMatch).toBe(false);
        });
    });

});