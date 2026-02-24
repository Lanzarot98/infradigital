const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { User, Permission } = require('../models');
const { logAudit } = require('../utils/auditLogger');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (role) {
      where.role = role;
    }

    const { rows: users, count: total } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, email, password, role, company } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, email y contraseña son obligatorios.'
      });
    }

    const existing = await User.scope('withPassword').findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Este correo electrónico ya está registrado.'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user',
      company: company || null
    });

    logAudit({
      userId: req.user.id,
      action: 'crear',
      tableName: 'users',
      recordId: user.id,
      newValues: { name, email, role: role || 'user', company },
      description: `Usuario "${name}" creado por administrador`
    });

    const userResponse = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] }
    });

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente.',
      data: { user: userResponse }
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    const { name, email, role, company, isActive } = req.body;
    const previousValues = {
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
      isActive: user.isActive
    };

    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email, id: { [Op.ne]: user.id } } });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Este correo electrónico ya está registrado por otro usuario.'
        });
      }
    }

    await user.update({
      name: name !== undefined ? name : user.name,
      email: email !== undefined ? email : user.email,
      role: role !== undefined ? role : user.role,
      company: company !== undefined ? company : user.company,
      isActive: isActive !== undefined ? isActive : user.isActive
    });

    logAudit({
      userId: req.user.id,
      action: 'actualizar',
      tableName: 'users',
      recordId: user.id,
      previousValues,
      newValues: { name: user.name, email: user.email, role: user.role, company: user.company, isActive: user.isActive },
      description: `Usuario "${user.name}" actualizado`
    });

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente.',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const user = await User.scope('withPassword').findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres.'
      });
    }

    user.password = newPassword;
    await user.save();

    logAudit({
      userId: req.user.id,
      action: 'actualizar',
      tableName: 'users',
      recordId: user.id,
      description: `Contraseña restablecida para usuario "${user.name}"`
    });

    res.json({
      success: true,
      message: 'Contraseña restablecida exitosamente.'
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes desactivar tu propia cuenta.'
      });
    }

    await user.update({ isActive: false });

    logAudit({
      userId: req.user.id,
      action: 'eliminar',
      tableName: 'users',
      recordId: user.id,
      description: `Usuario "${user.name}" desactivado`
    });

    res.json({
      success: true,
      message: 'Usuario desactivado exitosamente.'
    });
  } catch (error) {
    next(error);
  }
};

const getPermissions = async (req, res, next) => {
  try {
    const { role } = req.params;

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rol no válido. Use "admin" o "user".'
      });
    }

    const permissions = await Permission.findAll({
      where: { role },
      order: [['module', 'ASC']]
    });

    res.json({
      success: true,
      data: { permissions }
    });
  } catch (error) {
    next(error);
  }
};

const updatePermissions = async (req, res, next) => {
  try {
    const { role } = req.params;
    const { permissions } = req.body;

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rol no válido. Use "admin" o "user".'
      });
    }

    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un arreglo de permisos.'
      });
    }

    for (const perm of permissions) {
      await Permission.upsert({
        role,
        module: perm.module,
        canView: perm.canView !== undefined ? perm.canView : true,
        canCreate: perm.canCreate !== undefined ? perm.canCreate : false,
        canEdit: perm.canEdit !== undefined ? perm.canEdit : false,
        canDelete: perm.canDelete !== undefined ? perm.canDelete : false
      });
    }

    logAudit({
      userId: req.user.id,
      action: 'actualizar',
      tableName: 'permissions',
      description: `Permisos actualizados para rol "${role}"`
    });

    const updated = await Permission.findAll({
      where: { role },
      order: [['module', 'ASC']]
    });

    res.json({
      success: true,
      message: 'Permisos actualizados exitosamente.',
      data: { permissions: updated }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  resetPassword,
  delete: deleteUser,
  getPermissions,
  updatePermissions
};
