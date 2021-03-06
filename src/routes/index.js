import AuthController from '../controllers/AuthController'

export default (app) => {

// Create a catch-all route for testing the installation.
app.all('*', (req, res) => res.status(200).send({
  message: 'Hello World!',
}));

app.post('/api/auth/register', AuthController.signup);

// app.post('/api/auth/signup', [verifySignUp.checkDuplicateUserNameOrEmail, verifySignUp.checkRolesExisted], controller.signup);
	
// app.post('/api/auth/signin', controller.signin);

// app.get('/api/test/user', [authJwt.verifyToken], controller.userContent);

// app.get('/api/edit/addMeeting')

// app.get('/api/edit/edituser')
};

