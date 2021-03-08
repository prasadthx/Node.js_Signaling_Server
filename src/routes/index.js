import AuthController from '../controllers/authController'
const authorize = require('../middleware/authJwt')
export default (router) => {

// Create a catch-all route for testing the installation.
// router.all('*', (req, res) => res.status(200).send({
//   message: 'Hello World!',
// }));
router.post('/authenticate', AuthController.authenticateSchema, AuthController.authenticate);

router.post('/refresh-token', AuthController.refreshToken);

router.post('/revoke-token', authorize(), AuthController.revokeTokenSchema, AuthController.revokeToken);

router.post('/register', AuthController.registerSchema, AuthController.register);

router.post('/verify-email', AuthController.verifyEmailSchema, AuthController.verifyEmail);

router.post('/forgot-password', AuthController.forgotPasswordSchema, AuthController.forgotPassword);

router.post('/validate-reset-token', AuthController.validateResetTokenSchema, AuthController.validateResetToken);

router.post('/reset-password', AuthController.resetPasswordSchema, AuthController.resetPassword);

router.get('/:id', authorize(), AuthController.getById);

// router.post('/', authorize(Role.Admin), AuthController.createSchema, AuthController.create);

router.put('/user/:id', authorize(), AuthController.updateSchema, AuthController.update);

router.delete('/userdelete/:id', authorize(), AuthController.delete);
}
