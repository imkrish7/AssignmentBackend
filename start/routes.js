'use strict'

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URL's and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')

Route.post('/register', 'UserController.create');
Route.patch('/verify', 'UserController.verify');
Route.post('/login', 'UserController.login');
Route.patch('/resetPassword', 'UserController.resetPassword').middleware(['auth:jwt']);
Route.patch('/forgetPasswordOtp', 'UserController.forgetPasswordOtp');
Route.patch('/forgetPasswordReset', 'UserController.forgetPasswordReset');
Route.patch('/verifyForgetPasswordOtp', 'UserController.verifyForgetPasswordOtp');
Route.patch('/resend_otp', 'UserController.resendOtp');
