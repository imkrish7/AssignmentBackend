'use strict';
const User = use('App/Models/User');
const Mail = use('Mail');
const Env = use('Env');

class UserController {

	// User create or register controller
	async create({ request }) {
		const { email, name, phonenumber, password, countrycode } = request.all();
		const isUserExist = await User.findBy('email', email);
		try {
			if (!isUserExist) {
				const OTP = Math.floor(Math.random()*9999);
				const user = await User.create({
					name,
					email,
					phonenumber,
					password,
					countrycode,
					verificationOTP: OTP,
					verified: false,
				});
				const link = `/localhost:3000/verify?email=${user.email}`
				await Mail.connection('ethereal').send('emails.welcome', { ...user.toJSON(), link, OTP}, (message)=>{
					message.to(user.email).from(Env.get('MAIL_USERNAME'))
				})
				return { success: true};
			} else {
				return { success: false, msg: 'User already exist' };
			}
		} catch (error) {
			console.error(error);
			return { success: false, msg: 'Something went wrong' };
		}

	}

	// Resend Otp for account verification controller

	async resendOtp({ request }){
		const { email } = request.all();
		try {
			let user = await User.findBy('email', email);
			const OTP = Math.floor(Math.random() * 9999);
			user.verificationOTP = OTP;
			const link = `/localhost:3000/verify?email=${user.email}`
				await Mail.connection('ethereal').send('emails.welcome', { ...user.toJSON(), link, OTP}, (message)=>{
					message.to(user.email).from(Env.get('MAIL_USERNAME'))
				})
		} catch (error) {
			console.error(error);
			return { success: false,  msg: "Something went wrong"}
		}
	}

	// Login controller

	async login({ request , auth}){
		const { email, password } = request.all();
		const isUserExist = await User.findBy('email',email);
		try {
			if(isUserExist){
				if(isUserExist.verified){
					const token = await auth.authenticator('jwt').attempt(email, password);
					return { success: true, token };
				}else{ 
					return { success: false };
				}
			}else{ 
				return { success: false, msg: "User doesn't exist" }
			}
		} catch (error) {
			console.error(error);
			return { success: false, msg: "Something went wrong"}
		}
	}

	// Accound verfication controller
	async verify({ request }) {
		const { email, otp } = request.all();
		let isUserExist = await User.findBy('email',email);
		try {
			if(isUserExist){
				if(isUserExist.verificationOTP === otp ){
					isUserExist.verificationOTP = null;
					isUserExist.verified = true;
					isUserExist.save(); 
					return { success: true}
				}else{
					return { success: false, meg: 'wrong Otp'}
				}
			}else{ 
				return { success: false, msg: "User doesnot exists"}
			}
		} catch (error) {
			console.log(error)
			return { success: false, msg: 'Something went wrong'}
		}
	}

	// Forget password otp and link generation controller
	async forgetPassword({ request }){
		const { email } = request.all();
		try{
			const user = await User.findBy('email',email);
			const OTP = Math.floor(Math.random() * 9999);
			user.forgetPasswordOtp = OTP;
			const link = `/localhost:3000/verify?email=${user.email}`
				await Mail.connection('ethereal').send('emails.forgetPasswordOtp', { ...user.toJSON(), link, OTP}, (message)=>{
					message.to(user.email).from(Env.get('MAIL_USERNAME'))
				})
		}catch(error){

		}
	}
	// Otp verification for forgetPassword Controller
	async verifyforgetPasswordOtp({ request }){
		const { email, otp } = request.all();
		try {
			const user = await User.findBy('email',email);
			if(user){
				if(user.forgetPasswordOtp == otp){
					user.forgetPasswordOtp = null;
					return { success: true }
				}else{
					return { success: false, msg: "Please enter right otp"}
				}
			}else{
				return { success: false, msg: "User doesn't exist"}
			}
		} catch (error) {
			console.error(error);
			return { success:false, msg: 'Something went wrong'}
		}
	}

	// Reset forget password controller
	async forgetPasswordReset({ request }){
		const { email , newPasssword } = request.all();
		try {
			let user = await User.findBy('email',email);
			if(user){
				if(!user.forgetPasswordOtp){
					user.password = newPasssword;
					user.save();
					return { success: true}
				}else { 
					return { success: false, msg: "Please verify otp"}
				}
			}else{
				return { success: false, msg: "User doesn't exist"};
			}
			

		} catch (error) {
			console.error(error);
			return { success: false};
		}
	}

	// Reset Password controller
	async resetPassword({ request, auth }){
		const { oldPassword , newPassword } = request.all();
		const id = auth.user.id;
		try {
			const user = await User.find(id);
			if(user){
				if(user.password == oldPassword){
					user.password = newPassword;
					user.save();
					return { success: true };
				}else { 
					return { success: false, msg: "Old password is not same"};
				}
			}else{
				return { success: false, msg: "User doesn't exist"}
			 }
		} catch (error) {
			console.error(error);
			return { success: false, msg: "Something went wrong"}
		}
	}
}

module.exports = UserController;
