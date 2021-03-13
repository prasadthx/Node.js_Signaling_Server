import AuthController from '../controllers/authController'
const authorize = require('../middleware/authJwt')
export default (router) => {

// Create a catch-all route for testing the installation.
// router.all('*', (req, res) => res.status(200).send({
//   message: 'Hello World!',
// }));
router.post('/accounts/authenticate', AuthController.authenticateSchema, AuthController.authenticate);

router.post('/accounts/refresh-token', AuthController.refreshToken);

router.post('/accounts/revoke-token', authorize(), AuthController.revokeTokenSchema, AuthController.revokeToken);

router.post('/accounts/register', AuthController.registerSchema, AuthController.register);

router.post('/accounts/verify-email', AuthController.verifyEmailSchema, AuthController.verifyEmail);

router.post('/accounts/forgot-password', AuthController.forgotPasswordSchema, AuthController.forgotPassword);

router.post('/accounts/validate-reset-token', AuthController.validateResetTokenSchema, AuthController.validateResetToken);

router.post('/accounts/reset-password', AuthController.resetPasswordSchema, AuthController.resetPassword);

router.get('accounts/:id', authorize(), AuthController.getById);

// router.post('/', authorize(Role.Admin), AuthController.createSchema, AuthController.create);

router.put('/accounts/:id', authorize(), AuthController.updateSchema, AuthController.update);

router.delete('/accounts/:id', authorize(), AuthController.delete);

router.put('/accounts/createmeeting/:id', authorize(), AuthController.createMeetingSchema, AuthController.createMeeting);

router.get('/accounts/getmeetings/:id',authorize(),AuthController.getMeetings)

}
