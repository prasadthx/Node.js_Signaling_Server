import jwt from 'express-jwt';
import db from '../models/index.js'

module.exports = authorize;

function authorize() {
    return [
        // authenticate JWT token and attach user to request object (req.user)
        jwt({ secret:process.env.JWT_SECRET, algorithms: ['HS256'] }),

        // authorize based on user role
        async (req, res, next) => {
            const User = await db.User.findByPk(req.user.id);
            // if (!User || (roles.length && !roles.includes(account.role))) {
            //     // account no longer exists or role not authorized
            //     return res.status(401).json({ message: 'Unauthorized' });
            // }

            // authentication and authorization successful
            // req.user.role = account.role;
            const refreshTokens = await User.getRefreshTokens();
            req.user.ownsToken = token => !!refreshTokens.find(x => x.token === token);
            next();
        }
    ]};