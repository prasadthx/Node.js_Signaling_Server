import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
    class RefreshToken extends Model{
        static associate(models) {
            // define association here
            RefreshToken.belongsTo(models['User']);
          }
    };
    RefreshToken.init({
        token: { type: DataTypes.STRING },
        expires: { type: DataTypes.DATE },
        created: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        createdByIp: { type: DataTypes.STRING },
        revoked: { type: DataTypes.DATE },
        revokedByIp: { type: DataTypes.STRING },
        // replacedByToken: { type: DataTypes.STRING },
        isExpired: {
            type: DataTypes.VIRTUAL,
            get() { return Date.now() >= this.expires; }
        },
        isActive: {
            type: DataTypes.VIRTUAL,
            get() { return !this.revoked && !this.isExpired; }
        }
    },
    {
        sequelize,
        modelName: 'RefreshToken'
    });

    return RefreshToken;
};