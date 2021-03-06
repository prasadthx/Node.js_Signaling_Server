import { Op } from 'sequelize';
import model from '../models';

const { User } = model;

// export default {
//   async signUp(req, res) {
//     const {defaultName, email, firstName, lastName, password, meetings} = req.body;
//     try {
//       const user = await User.findOne({where: {[Op.or]: [ {email} ]}});
//       if(user) {
//         return res.status(422)
//         .send({message: 'User with that email or phone already exists'});
//       }

//       await User.create({
//         defaultName,
//         email,
//         firstName,
//         lastName,
//         password,
//         meetings,
//       });
//       return res.status(201).send({message: 'Account created successfully'});
//     } catch(e) {
//       console.log(e);
//       return res.status(500)
//       .send(
//         {message: 'Could not perform operation at this time, kindly try again later.'});
//     }
//   }
// }

export default {
    signup(req, res){
    // Save User to Database
    const {defaultName, email, firstName, lastName, password, meetings} = req.body;
    User.create({
        defaultName,
        email,
        firstName,
        lastName,
        password: bcrypt.hashSync(password, 8),
        meetings,
    })
      .then( () => {
        res.status(201).send({message: 'Account created successfully'});
      })
      .catch(err => {
        console.log(e);
        return res.status(500)
        .send(
        {message: 'Could not perform operation at this time, kindly try again later.'});
      });
  },
  
  signin(req, res){
    const {email, password} = req.body;
    User.findOne({
        where: {
          email: email
        }
      })
    .then(user => {
        if (!user) {
          return res.status(404).send({ message: "User Not found." });
        }
  
        var passwordIsValid = bcrypt.compareSync(
          password,
          user.password
        );
  
        if (!passwordIsValid) {
          return res.status(401).send({
            accessToken: null,
            message: "Invalid Password!"
          });
        }
  
        var token = jwt.sign({ id: user.id }, config.secret, {
          expiresIn: 86400 // 24 hours
        });

        return res.status(200).send({
        id: user.id,
        username: user.username,
        email: user.email,
        accessToken: token
        });
        
      })
      .catch(err => {
        res.status(500).send({ message: err.message });
      });
  }
}
