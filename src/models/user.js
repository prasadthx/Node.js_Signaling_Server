import { Model } from 'sequelize';

const PROTECTED_ATTRIBUTES = ['password'];

export default (sequelize, DataTypes) => {
  class User extends Model {
    toJSON() {
      // hide protected fields
      const attributes = { ...this.get() };
      // eslint-disable-next-line no-restricted-syntax
      for (const a of PROTECTED_ATTRIBUTES) {
        delete attributes[a];
      }
      return attributes;
    }
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasMany(models['RefreshToken'], {onDelete: 'CASCADE' })
    }
  };
  User.init({
    defaultName: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      allowNull: {
        args: false,
        msg: 'Please enter your email address',
      },
      unique: {
        args: true,
        msg: 'Email already exists',
      },
      validate: {
        isEmail: {
          args: true,
          msg: 'Please enter a valid email address',
        },
      },
    },
    
    firstName: {
      type: DataTypes.STRING,
      allowNull: {
        args: false,
        msg: 'Please enter your first name',
      },
    },
    
    lastName: {
      type: DataTypes.STRING,
      allowNull: {
        args: false,
        msg: 'Please enter your first name',
      },
    },
    
    password: {
      type: DataTypes.STRING,
      allowNull: {
        args: false,
        msg: 'Please enter your password',
      },
    },
    
    verificationToken: { type: DataTypes.STRING },
        
    verified: { type: DataTypes.DATE },
        
    resetToken: { type: DataTypes.STRING },
        
    resetTokenExpires: { type: DataTypes.DATE },
        
    passwordReset: { type: DataTypes.DATE },
    
    meetings: { type: DataTypes.JSON },
    
    last_login_at: DataTypes.DATE,

    isVerified: {
      type: DataTypes.VIRTUAL,
      get() { return !!(this.verified || this.passwordReset); }
    }
  }, 
  {
    sequelize,
    modelName: 'User',
  });
  return User;
};
