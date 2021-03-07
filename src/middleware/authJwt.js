const jwt = require('express-jwt');
// const { secret } = require('config.json');
const db = require('../models/index');

module.exports = authorize;

function authorize(roles = []) {
    return [
        // authenticate JWT token and attach user to request object (req.user)
        jwt({ secret:"Hello world", algorithms: ['HS256'] }),

        // authorize based on user role
        async (req, res, next) => {
            const account = await db.Account.findByPk(req.user.id);

            if (!account || (roles.length && !roles.includes(account.role))) {
                // account no longer exists or role not authorized
                return res.status(401).json({ message: 'Unauthorized' });
            }

            // authentication and authorization successful
            req.user.role = account.role;
            const refreshTokens = await account.getRefreshTokens();
            req.user.ownsToken = token => !!refreshTokens.find(x => x.token === token);
            next();
        }
    ]};