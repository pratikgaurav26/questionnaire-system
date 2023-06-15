const express = require('express')
const router = express.Router()
const AuthController = require('../Controllers/Auth.Controller')

router.post('/welcome', AuthController.register)

router.post('/register', AuthController.register)

router.post('/login', AuthController.login)

router.delete('/edit/phonenumber', AuthController.logout)

router.post('/submit-test', AuthController.refreshToken)

module.exports = router
