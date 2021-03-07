const config = require('../config/config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require("crypto");
const { Op } = require('sequelize');
const sendEmail = require('../helpers/sendEmail');
const db = require('../models/index');

module.exports = {
    authenticate,
    refreshToken,
    revokeToken,
    register,
    verifyEmail,
    forgotPassword,
    validateResetToken,
    resetPassword,
    getAll,
    getById,
    create,
    update,
    delete: _delete
};

async function authenticate({ email, password, ipAddress }) {
    const User = await db.User.scope('withHash').findOne({ where: { email } });

    if (!User || !User.isVerified ){
        throw 'Unregisterd or unverified'
    }
        
    if(!(await bcrypt.compare(password, User.password))) {
        throw 'Password is incorrect';
    }

    // authentication successful so generate jwt and refresh tokens
    const jwtToken = generateJwtToken(User);
    const refreshToken = generateRefreshToken(User, ipAddress);

    // save refresh token
    await refreshToken.save();

    // return basic details and tokens
    return {
        ...basicDetails(User),
        jwtToken,
        refreshToken: refreshToken.token
    };
}

async function refreshToken({ token, ipAddress }) {
    const refreshToken = await getRefreshToken(token);
    const User = await refreshToken.getUser();

    // replace old refresh token with a new one and save
    const newRefreshToken = generateRefreshToken(User, ipAddress);
    refreshToken.revoked = Date.now();
    refreshToken.revokedByIp = ipAddress;
    refreshToken.replacedByToken = newRefreshToken.token;
    await refreshToken.save();
    await newRefreshToken.save();

    // generate new jwt
    const jwtToken = generateJwtToken(User);

    // return basic details and tokens
    return {
        ...basicDetails(User),
        jwtToken,
        refreshToken: newRefreshToken.token
    };
}

async function revokeToken({ token, ipAddress }) {
    const refreshToken = await getRefreshToken(token);

    // revoke token and save
    refreshToken.revoked = Date.now();
    refreshToken.revokedByIp = ipAddress;
    await refreshToken.save();
}

async function register(params, origin) {
    // validate
    if (await db.User.findOne({ where: { email: params.email } })) {
        // send already registered error in email to prevent account enumeration
        return await sendAlreadyRegisteredEmail(params.email, origin);
    }

    // create account object
    const User = new db.User(params);

    // first registered account is an admin
    User.verificationToken = randomTokenString();

    // hash password
    User.password = await hash(params.password);

    // save account
    await User.save();

    // send email
    await sendVerificationEmail(User, origin);
}

async function verifyEmail({ token }) {
    const User = await db.User.findOne({ where: { verificationToken: token } });

    if (!User) throw 'Verification failed';

    User.verified = Date.now();
    User.verificationToken = null;
    await User.save();
}

async function forgotPassword({ email }, origin) {
    const User = await db.User.findOne({ where: { email } });

    // always return ok response to prevent email enumeration
    if (!User) return;

    // create reset token that expires after 24 hours
    User.resetToken = randomTokenString();
    User.resetTokenExpires = new Date(Date.now() + 24*60*60*1000);
    await User.save();

    // send email
    await sendPasswordResetEmail(User, origin);
}

async function validateResetToken({ token }) {
    const User = await db.User.findOne({
        where: {
            resetToken: token,
            resetTokenExpires: { [Op.gt]: Date.now() }
        }
    });

    if (!User) throw 'Invalid token';

    return User;
}

async function resetPassword({ token, password }) {
    const User = await validateResetToken({ token });

    // update password and remove reset token
    User.password = await hash(password);
    User.resetToken = null;
    await User.save();
}

async function getAll() {
    const Users = await db.User.findAll();
    return Users.map(x => basicDetails(x));
}

async function getById(id) {
    const User = await getUser(id);
    return basicDetails(User);
}

async function create(params) {
    // validate
    if (await db.User.findOne({ where: { email: params.email } })) {
        throw 'Email "' + params.email + '" is already registered';
    }

    const User = new db.User(params);
    User.verified = Date.now();

    // hash password
    User.password = await hash(params.password);

    // save account
    await User.save();

    return basicDetails(User);
}

async function update(id, params) {
    const User = await getUser(id);

    // validate (if email was changed)
    if (params.email && User.email !== params.email && await db.User.findOne({ where: { email: params.email } })) {
        throw 'Email "' + params.email + '" is already taken';
    }

    // hash password if it was entered
    if (params.password) {
        params.password = await hash(params.password);
    }

    // copy params to account and save
    Object.assign(User, params);
    await User.save();

    return basicDetails(User);
}

async function _delete(id) {
    const User = await getUser(id);
    await User.destroy();
}

// helper functions

async function getUser(id) {
    const User = await db.User.findByPk(id);
    if (!User) throw 'User not found';
    return User;
}

async function getRefreshToken(token) {
    const refreshToken = await db.RefreshToken.findOne({ where: { token:token } });
    if (!refreshToken || !refreshToken.isActive) throw 'Invalid token';
    return refreshToken;
}

async function hash(password) {
    return await bcrypt.hash(password, 10);
}

function generateJwtToken(User) {
    // create a jwt token containing the account id that expires in 15 minutes
    return jwt.sign({ sub: User.id, id: User.id }, config.secret, { expiresIn: '15m' });
}

function generateRefreshToken(User, ipAddress) {
    // create a refresh token that expires in 7 days
    return new db.RefreshToken({
        accountId: User.id,
        token: randomTokenString(),
        expires: new Date(Date.now() + 7*24*60*60*1000),
        createdByIp: ipAddress
    });
}

function randomTokenString() {
    return crypto.randomBytes(40).toString('hex');
}

function basicDetails(User) {
    const { id, firstName, lastName, email, created, updated, isVerified } = User;
    return { id, firstName, lastName, email, created, updated, isVerified };
}

async function sendVerificationEmail(User, origin) {
    let message;
    if (origin) {
        const verifyUrl = `${origin}/account/verify-email?token=${User.verificationToken}`;
        message = `<p>Please click the below link to verify your email address:</p>
                   <p><a href="${verifyUrl}">${verifyUrl}</a></p>`;
    } else {
        message = `<p>Please use the below token to verify your email address with the <code>/account/verify-email</code> api route:</p>
                   <p><code>${User.verificationToken}</code></p>`;
    }

    await sendEmail({
        to: User.email,
        subject: 'Sign-up Verification API - Verify Email',
        html: `<h4>Verify Email</h4>
               <p>Thanks for registering!</p>
               ${message}`
    });
}

async function sendAlreadyRegisteredEmail(email, origin) {
    let message;
    if (origin) {
        message = `<p>If you don't know your password please visit the <a href="${origin}/account/forgot-password">forgot password</a> page.</p>`;
    } else {
        message = `<p>If you don't know your password you can reset it via the <code>/account/forgot-password</code> api route.</p>`;
    }

    await sendEmail({
        to: email,
        subject: 'Sign-up Verification API - Email Already Registered',
        html: `<h4>Email Already Registered</h4>
               <p>Your email <strong>${email}</strong> is already registered.</p>
               ${message}`
    });
}

async function sendPasswordResetEmail(User, origin) {
    let message;
    if (origin) {
        const resetUrl = `${origin}/account/reset-password?token=${User.resetToken}`;
        message = `<p>Please click the below link to reset your password, the link will be valid for 1 day:</p>
                   <p><a href="${resetUrl}">${resetUrl}</a></p>`;
    } else {
        message = `<p>Please use the below token to reset your password with the <code>/account/reset-password</code> api route:</p>
                   <p><code>${User.resetToken}</code></p>`;
    }

    await sendEmail({
        to: User.email,
        subject: 'Sign-up Verification API - Reset Password',
        html: `<h4>Reset Password Email</h4>
               ${message}`
    });
}