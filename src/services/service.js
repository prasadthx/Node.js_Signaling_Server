const config = require('../config/config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require("crypto");
const { Op } = require('sequelize');
const sendEmail = require('../helpers/sendEmail');
import model from '../models';

const { User } = model;
const { RefreshToken } = model;


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
    update,
    delete: _delete,
    createmeeting,
    getMeetings
};

async function authenticate({ email, password, ipAddress }) {
    const user = await User.findOne({ where: { email } });

    if (!user || !user.isVerified ){
        throw 'Unregisterd or unverified'
    }
        
    if(!(await bcrypt.compare(password, user.password))) {
        throw 'Password is incorrect';
    }

    // authentication successful so generate jwt and refresh tokens
    const jwtToken = generateJwtToken(user);
    const refreshToken = await generateRefreshToken(user, ipAddress);

    // // save refresh token
    console.log("---------------////////////////-------------")
    
    console.log(refreshToken.token)
    await refreshToken.save();

    // return basic details and tokens
    return {
        ...basicDetails(user),
        jwtToken,
        refreshToken: refreshToken.token
    };
}

async function refreshToken({ token, ipAddress }) {
    const refreshToken = await getRefreshToken(token);
    const user = await refreshToken.getUser();

    // replace old refresh token with a new one and save
    const newRefreshToken = await generateRefreshToken(user, ipAddress);
    // refreshToken.revoked = Date.now();
    // refreshToken.revokedByIp = ipAddress;
    // refreshToken.replacedByToken = newRefreshToken.token;
    // await refreshToken.save();
    await newRefreshToken.save();

    // generate new jwt
    const jwtToken = generateJwtToken(user);
    console.log("--------------------------------------")
    console.log("###################################")
    console.log(jwtToken)
    // return basic details and tokens
    return {
        ...basicDetails(user),
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
    console.log(" ---------------------**************-------------------------")
    console.log(User)
    console.log(params)
    if (await User.findOne({ where: { email: params.email } })) {
        // send already registered error in email to prevent account enumeration
        // return await sendAlreadyRegisteredEmail(params.email, origin);
        return "Email already registered."
    }

    // create account object
    const user = new User(params);

    // first registered account is an admin
    user.verificationToken = randomTokenString();

    // hash password
    user.password = await hash(params.password);

    // save account
    await user.save();

    // send email
    await sendVerificationEmail(user, origin);
}

async function verifyEmail({ token }) {
    const user = await User.findOne({ where: { verificationToken: token } });

    if (!user) throw 'Verification failed';

    user.verified = Date.now();
    user.verificationToken = null;
    await user.save();
}

async function forgotPassword({ email }, origin) {
    const user = await User.findOne({ where: { email } });

    // always return ok response to prevent email enumeration
    if (!user) return "User not found";

    // create reset token that expires after 24 hours
    user.resetToken = randomTokenString();
    user.resetTokenExpires = new Date(Date.now() + 24*60*60*1000);
    await user.save();

    // send email
    await sendPasswordResetEmail(user, origin);
}

async function validateResetToken({ token }) {
    const user = await User.findOne({
        where: {
            resetToken: token,
            resetTokenExpires: { [Op.gt]: Date.now() }
        }
    });

    if (!user) throw 'Invalid token';

    return user;
}

async function resetPassword({ token, password }) {
    const user = await validateResetToken({ token });

    // update password and remove reset token
    user.password = await hash(password);
    user.resetToken = null;
    await user.save();
}

async function getAll() {
    const users = await db.User.findAll();
    return users.map(x => basicDetails(x));
}

async function getById(id) {
    const user = await getUser(id);
    return basicDetails(user);
}

// async function create(params) {
//     // validate
//     if (await db.User.findOne({ where: { email: params.email } })) {
//         throw 'Email "' + params.email + '" is already registered';
//     }

//     const User = new db.User(params);
//     User.verified = Date.now();

//     // hash password
//     User.password = await hash(params.password);

//     // save account
//     await User.save();

//     return basicDetails(User);
// }

async function update(id, params) {
    const user = await getUser(id);

    // validate (if email was changed)
    if (params.email && user.email !== params.email && await User.findOne({ where: { email: params.email } })) {
        throw 'Email "' + params.email + '" is already taken';
    }

    // hash password if it was entered
    if (params.password) {
        params.password = await hash(params.password);
    }

    // copy params to account and save
    Object.assign(user, params);
    await user.save();

    return basicDetails(user);
}

async function createmeeting(id, params) {
    let user = await getUser(id);
    console.log("#########################//////////rprasf///////////////####################")
    console.log(params.id)
    console.log(user.meetings)
    if(user.meetings==null){
        user.meetings={}
    }
    else{
        console.log(params.meetingid)
        console.log(params.description)
        let meetingid = params.meetingid;
        let description = params.description;
        let newmeeting={};
        newmeeting[meetingid] = description
        user.meetings = { ...user.meetings,...newmeeting}
        console.log(user.meetings)
    }
    
    await user.save()
    return basicDetails(user)
}

async function getMeetings(id) {
    const user = await getUser(id)
    console.log("/////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\")
    console.log(user.meetings)
    return user.meetings
}

async function _delete(id) {
    const user = await getUser(id);
    await user.destroy();
}

// helper functions

async function getUser(id) {
    const user = await User.findByPk(id);
    if (!user) throw 'User not found';
    return user;
}

async function getRefreshToken(token) {
    const refreshToken = await RefreshToken.findOne({ where: { token } });
    if (!refreshToken || !refreshToken.isActive) throw 'Invalid token';
    return refreshToken;
}

async function hash(password) {
    return await bcrypt.hash(password, 10);
}

function generateJwtToken(user) {
    // create a jwt token containing the account id that expires in 15 minutes
    return jwt.sign({ sub: user.id, id: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
}

async function generateRefreshToken(user, ipAddress) {

    //delete old token
    const oldRefreshToken = await RefreshToken.findOne({ where: { UserId:user.id } });
    if(oldRefreshToken){
        await oldRefreshToken.destroy();
        console.log("Old token destroyed and new token set.")
    }

    // create a refresh token that expires in 7 days
    return new RefreshToken({
        UserId: user.id,
        token: randomTokenString(),
        expires: new Date(Date.now() + 7*24*60*60*1000),
        createdByIp: ipAddress
    });
}

function randomTokenString() {
    return crypto.randomBytes(40).toString('hex');
}

function basicDetails(user) {
    const { id, firstName, lastName, email, createdAt, updatedAt, isVerified } = user;
    return { id, firstName, lastName, email, createdAt, updatedAt, isVerified };
}

async function sendVerificationEmail(user, origin) {
    let message;
    if (origin) {
        const verifyUrl = `${origin}/auth/account/verify-email?token=${user.verificationToken}`;
        message = `<p>Please click the below link to verify your email address:</p>
                   <p><a href="${verifyUrl}">${verifyUrl}</a></p>`;
    } else {
        message = `<p>Please use the below token to verify your email address with the <code>/account/verify-email</code> api route:</p>
                   <p><code>${user.verificationToken}</code></p>`;
    }

    await sendEmail({
        to: user.email,
        subject: 'Sign-up Verification API - Verify Email',
        html: `<h4>Verify Email</h4>
               <p>Thanks for registering!</p>
               ${message}`
    });
}

// async function sendAlreadyRegisteredEmail(email, origin) {
//     let message;
//     if (origin) {
//         message = `<p>If you don't know your password please visit the <a href="${origin}/account/forgot-password">forgot password</a> page.</p>`;
//     } else {
//         message = `<p>If you don't know your password you can reset it via the <code>/account/forgot-password</code> api route.</p>`;
//     }

//     await sendEmail({
//         to: email,
//         subject: 'Sign-up Verification API - Email Already Registered',
//         html: `<h4>Email Already Registered</h4>
//                <p>Your email <strong>${email}</strong> is already registered.</p>
//                ${message}`
//     });
// }

async function sendPasswordResetEmail(user, origin) {
    let message;
    if (origin) {
        const resetUrl = `${origin}/auth/account/reset-password?token=${user.resetToken}`;
        message = `<p>Please click the below link to reset your password, the link will be valid for 1 day:</p>
                   <p><a href="${resetUrl}">${resetUrl}</a></p>`;
    } else {
        message = `<p>Please use the below token to reset your password with the <code>/account/reset-password</code> api route:</p>
                   <p><code>${user.resetToken}</code></p>`;
    }

    await sendEmail({
        to: user.email,
        subject: 'Sign-up Verification API - Reset Password',
        html: `<h4>Reset Password Email</h4>
               ${message}`
    });
}