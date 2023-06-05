const db = require("../models");
const config = require("../config/auth.config");

const stripe = require("stripe")(process.env.SECRET_KEY);
const User = db.user;
const Role = db.role;

const Op = db.Sequelize.Op;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

exports.signup = async (req, res) => {
  const email = req.body.email;

  const customers = await stripe.customers.list({
    email: email
  });

  var subscriptionId;
  var subscriptionStatus;

  for (const customer of customers.data) {
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id
    });
    for (const subscription of subscriptions.data) {
      subscriptionId = subscription.id;
      subscriptionStatus = subscription.status;
      // Do something with the subscription ID and status
    }
  }

  const currentDate = new Date();
  const expireDate = new Date();
  expireDate.setDate(currentDate.getDate() + 7);

  User.create({
    username: req.body.username,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8),
    subscriptionId: subscriptionId,
    subscriptionStatus: subscriptionStatus,
    expireDate: expireDate
  })
    .then((user) => {
      if (req.body.roles) {
        Role.findAll({
          where: {
            name: {
              [Op.or]: req.body.roles
            }
          }
        }).then((roles) => {
          user.setRoles(roles).then(() => {
            res.send({ message: "User was registered successfully!" });
          });
        });
      } else {
        // user role = 1
        user.setRoles([1]).then(() => {
          res.send({ message: "User was registered successfully!" });
        });
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

exports.signin = (req, res) => {
  User.findOne({
    where: {
      username: req.body.username
    }
  })
    .then((user) => {
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
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

      var authorities = [];
      user.getRoles().then((roles) => {
        for (let i = 0; i < roles.length; i++) {
          authorities.push("ROLE_" + roles[i].name.toUpperCase());
        }

        const currentDate = new Date();
        var expiredays = (user.expireDate - currentDate) / (1000 * 3600 * 24);

        if (expiredays < 0) {
          expiredays = 0;
        }
        res.status(200).send({
          id: user.id,
          username: user.username,
          email: user.email,
          expiredays: expiredays,
          roles: authorities,
          subscriptionId: user.subscriptionId,
          subscriptionStatus: user.subscriptionStatus,
          expireDate: user.expireDate,
          accessToken: token
        });
      });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};
