const { Permission } = require('../models');

const ACTION_MAP = {
  view: 'canView',
  create: 'canCreate',
  edit: 'canEdit',
  delete: 'canDelete'
};

const checkPermission = (module, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Debe autenticarse primero.'
        });
      }

      const field = ACTION_MAP[action];
      if (!field) {
        return res.status(400).json({
          success: false,
          message: `Acción "${action}" no reconocida.`
        });
      }

      const permission = await Permission.findOne({
        where: { role: req.user.role, module }
      });

      if (!permission || !permission[field]) {
        return res.status(403).json({
          success: false,
          message: `No tiene permisos para ${action === 'view' ? 'ver' : action === 'create' ? 'crear en' : action === 'edit' ? 'editar en' : 'eliminar en'} el módulo "${module}".`
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { checkPermission };
