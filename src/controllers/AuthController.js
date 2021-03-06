import { Op } from 'sequelize';
import model from '../models';

const { User } = model;

export default {
  async signUp(req, res) {
    const {defaultName, email, firstName, lastName, password, meetings} = req.body;
    try {
      const user = await User.findOne({where: {[Op.or]: [ {email} ]}});
      if(user) {
        return res.status(422)
        .send({message: 'User with that email or phone already exists'});
      }

      await User.create({
        defaultName,
        email,
        firstName,
        lastName,
        password,
        meetings,
      });
      return res.status(201).send({message: 'Account created successfully'});
    } catch(e) {
      console.log(e);
      return res.status(500)
      .send(
        {message: 'Could not perform operation at this time, kindly try again later.'});
    }
  }
}