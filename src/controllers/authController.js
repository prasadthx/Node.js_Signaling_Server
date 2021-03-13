import validateRequest from '../helpers/validateRequest';
import Joi from 'joi';
import * as UserService from '../services/service'
module.exports = {
    authenticate,
    authenticateSchema,
    refreshToken,
    revokeToken,
    revokeTokenSchema,
    registerSchema,
    register,
    verifyEmailSchema,
    verifyEmail,
    forgotPasswordSchema,
    forgotPassword,
    validateResetTokenSchema,
    validateResetToken,
    resetPasswordSchema,
    resetPassword,
    // getAll,
    getById,
    // createSchema,
    // create,
    updateSchema,
    update,
    delete:_delete,
    setTokenCookie,
    createMeeting,
    createMeetingSchema,
    getMeetings
}

function authenticateSchema(req, res, next) {
    const schema = Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function authenticate(req, res, next) {
    const { email, password } = req.body;
    const ipAddress = req.ip;
    UserService.authenticate({ email, password, ipAddress })
        .then(({ refreshToken, ...user }) => {
            setTokenCookie(res, refreshToken);
            
            res.json(user);
        })
        .catch(next);
}

function refreshToken(req, res, next) {
    const token = req.cookies.refreshToken;
    const ipAddress = req.ip;
    UserService.refreshToken({ token, ipAddress })
        .then(({ refreshToken, ...user }) => {
            setTokenCookie(res, refreshToken);
            res.json(user);
        })
        .catch(next);
}

function revokeTokenSchema(req, res, next) {
    const schema = Joi.object({
        token: Joi.string().empty('')
    });
    validateRequest(req, next, schema);
}

function revokeToken(req, res, next) {
    // accept token from request body or cookie
    const token = req.body.token || req.cookies.refreshToken;
    const ipAddress = req.ip;

    if (!token) return res.status(400).json({ message: 'Token is required' });

    // users can revoke their own tokens and admins can revoke any tokens
    if (!req.user.ownsToken(token)) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    
    UserService.revokeToken({ token, ipAddress })
        .then(() => res.json({ message: 'Token revoked' }))
        .catch(next);
}

function registerSchema(req, res, next) {
    const schema = Joi.object({
        // defaultName: Joi.string(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    });
    validateRequest(req, next, schema);
}

function register(req, res, next) {
    UserService.register(req.body, req.get('origin'))
        .then(() => res.json({ message: 'Registration successful, please check your email for verification instructions' }))
        .catch(next);
}

function verifyEmailSchema(req, res, next) {
    const schema = Joi.object({
        token: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function verifyEmail(req, res, next) {
    UserService.verifyEmail(req.body)
        .then(() => res.json({ message: 'Verification successful, you can now login' }))
        .catch(next);
}

function forgotPasswordSchema(req, res, next) {
    const schema = Joi.object({
        email: Joi.string().email().required()
    });
    validateRequest(req, next, schema);
}

function forgotPassword(req, res, next) {
    UserService.forgotPassword(req.body, req.get('origin'))
        .then(() => res.json({ message: 'Please check your email for password reset instructions' }))
        .catch(next);
}

function validateResetTokenSchema(req, res, next) {
    const schema = Joi.object({
        token: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function validateResetToken(req, res, next) {
    UserService.validateResetToken(req.body)
        .then(() => res.json({ message: 'Token is valid' }))
        .catch(next);
}

function resetPasswordSchema(req, res, next) {
    const schema = Joi.object({
        token: Joi.string().required(),
        password: Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    });
    validateRequest(req, next, schema);
}

function resetPassword(req, res, next) {
    UserService.resetPassword(req.body)
        .then(() => res.json({ message: 'Password reset successful, you can now login' }))
        .catch(next);
}

// function getAll(req, res, next) {
//     accountService.getAll()
//         .then(accounts => res.json(accounts))
//         .catch(next);
// }

function getById(req, res, next) {
    // users can get their own account and admins can get any account
    if (Number(req.params.id) !== req.user.id) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    UserService.getById(req.params.id)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(next);
}

// function createSchema(req, res, next) {
//     const schema = Joi.object({
//         title: Joi.string().required(),
//         firstName: Joi.string().required(),
//         lastName: Joi.string().required(),
//         email: Joi.string().email().required(),
//         password: Joi.string().min(6).required(),
//         confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
//         role: Joi.string().valid(Role.Admin, Role.User).required()
//     });
//     validateRequest(req, next, schema);
// }

// function create(req, res, next) {
//     accountService.create(req.body)
//         .then(account => res.json(account))
//         .catch(next);
// }

function updateSchema(req, res, next) {
    const schemaRules = {
        defaultName: Joi.string().empty(''),
        firstName: Joi.string().empty(''),
        lastName: Joi.string().empty(''),
        email: Joi.string().email().empty(''),
        password: Joi.string().min(6).empty(''),
        confirmPassword: Joi.string().valid(Joi.ref('password')).empty('')
    };

    const schema = Joi.object(schemaRules).with('password', 'confirmPassword');
    validateRequest(req, next, schema);
}

function update(req, res, next) {
    // users can update their own account and admins can update any account
    if (Number(req.params.id) !== req.user.id) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    UserService.update(req.params.id, req.body)
        .then(account => res.json(account))
        .catch(next);
}

function createMeetingSchema(req, res, next) {
    const schema = Joi.object({
        meetingid:Joi.string().required(),
        description:Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function createMeeting(req, res, next) {
    // users can update their own account and admins can update any account
    if (Number(req.params.id) !== req.user.id) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log("#########################//////////rprasf///////////////####################")
    console.log("Create Meeitng serveiceskjfsdffsdf")

    UserService.createmeeting(req.params.id, req.body)
        .then(account => res.json(account))
        .catch(next);
}

function getMeetings(req, res,next) {
    console.log("#########################//////////rprasf///////////////####################")
    console.log("Create Meeitng serveiceskjfsdffsdf")
    if (Number(req.params.id) !== req.user.id) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log("#########################//////////rprasf///////////////####################")
    console.log("Create Meeitng serveiceskjfsdffsdf")

    UserService.getMeetings(req.params.id)
        .then(meetings => res.json(meetings))
        .catch(next);
}

function _delete(req, res, next) {
    // users can delete their own account and admins can delete any account
    if (Number(req.params.id) !== req.user.id) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    UserService.delete(req.params.id)
        .then(() => res.json({ message: 'Account deleted successfully' }))
        .catch(next);
}

// helper functions

function setTokenCookie(res, token) {
    // create cookie with refresh token that expires in 7 days
    const cookieOptions = {
        httpOnly: true,
        expires: new Date(Date.now() + 7*24*60*60*1000)
    };
    res.cookie('refreshToken', token, cookieOptions);
}