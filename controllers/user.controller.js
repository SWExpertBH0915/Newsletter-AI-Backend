const db = require("../models");
const config = require("../config/auth.config");
const User = db.user;
const Role = db.role;
const Op = db.Sequelize.Op;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

exports.allAccess = (req, res) => {
  res.status(200).send("Public Content.");
};

exports.userBoard = (req, res) => {
  const id = req.params.id;

  User.findOne({
    where: {
      id: id
    }
  })
    .then((user) => {
      if (user) {
        var token = jwt.sign({ id: user.id }, config.secret, {
          expiresIn: 86400 // 24 hours
        });
        var authorities = [];
        // const expireday = data.expiredate - Date.now()
        user.getRoles().then((roles) => {
          for (let i = 0; i < roles.length; i++) {
            authorities.push("ROLE_" + roles[i].name.toUpperCase());
          }
          var expiredays = (user.expireDate - Date.now()) / (3600 * 24 * 1000);
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
      } else {
        res.status(404).send({
          message: `Cannot find user with id=${id}.`
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error retrieving user with id=" + id
      });
    });
};

exports.updateExpireDay = (req, res) => {
  const id = req.params.id;
  console.log(id);
  var expireDate = { expiexpireDateredate: Date.now() };
  User.findByPk(id).then((user) => {
    const remainday = user.expireDate - Date.now();
    if (remainday < 0) {
      expireDate.expireDate = Date.now() + 4 * 7 * 24 * 3600 * 1000;
    } else {
      expireDate.expireDate = remainday + Date.now() + 4 * 7 * 24 * 3600 * 1000;
    }
    User.update(expireDate, {
      where: { id: id }
    })
      .then((num) => {
        if (num == 1) {
          res.send({
            message: "success"
          });
        } else {
          res.send({
            message: `Cannot update user with id=${id}. Maybe user was not found or req.body is empty!`
          });
        }
      })
      .catch((err) => {
        res.status(500).send({
          message: "Error updating user with id=" + id
        });
      });
  });
};

exports.adminBoard = (req, res) => {
  res.status(200).send("Admin Content.");
};

exports.create = (req, res) => {
  // Validate request
  if (!req.body.username) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }
  // Create a user
  const user = {
    username: req.body.username,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8),
    roles: req.body.roles,
    expireDate: req.body.expireDate
  };

  // Save user in the database
  User.create(user)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while creating the user."
      });
    });
};

exports.findAll = (req, res) => {
  User.findAll()
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving users."
      });
    });
};

exports.update = (req, res) => {
  const id = req.params.id;
  var updatedata = req.body;
  if (updatedata.password) {
    updatedata.password = bcrypt.hashSync(req.body.password, 8);
  }
  User.update(updatedata, {
    where: { id: id }
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "user was updated successfully."
        });
      } else {
        res.send({
          message: `Cannot update user with id=${id}. Maybe user was not found or req.body is empty!`
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error updating user with id=" + id
      });
    });
};
exports.delete = (req, res) => {
  const id = req.params.id;

  User.destroy({
    where: { id: id }
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "user was deleted successfully!"
        });
      } else {
        res.send({
          message: `Cannot delete user with id=${id}. Maybe user was not found!`
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Could not delete user with id=" + id
      });
    });
};
