'use strict';
const User = use('App/Models/User');
const Mail = use('Mail');
const Env = use('Env');
const Hash = use('Hash');

class UserController {

	// User create or register controller
	async create({ request, response }) {
		const { email, name, phoneNumber, password, countryCode } = request.all();
		const isUserExist = await User.findBy('email', email);
		try {
			if (!isUserExist) {
				const OTP = Math.floor(Math.random()*9999);
				const user = await User.create({
					name,
					email,
					phoneNumber,
					password,
					countrycode: countryCode ? countryCode : '91',
					verificationOTP: OTP,
					forgetPasswordOtp: null,
					verified: false,
				});
				const link = `/localhost:3000/verify?email=${user.email}`
				await Mail.connection('ethereal').send('emails.welcome', { ...user.toJSON(), link, OTP}, (message)=>{
					message.to(user.email).from(Env.get('MAIL_USERNAME'))
				})
				return { success: true};
			} else {
				return response.status(400).json({ success: false, msg: 'User already exist' });
			}
		} catch (error) {
			console.error(error);
			return response.status(500).json({ success: false, msg: 'Something went wrong' });
		}

	}

	// Resend Otp for account verification controller

	async resendOtp({ request, response }){
		const { email } = request.all();
		try {
			let user = await User.findBy('email', email);
			const OTP = Math.floor(Math.random() * 9999);
			user.verificationOTP = OTP;
			await user.save();
			const link = `/localhost:3000/verify?email=${user.email}`
				await Mail.connection('ethereal').send('emails.welcome', { ...user.toJSON(), link, OTP}, (message)=>{
					message.to(user.email).from(Env.get('MAIL_USERNAME'))
				})
			return { success: true }
		} catch (error) {
			console.error(error);
			return response.status(500).json({ success: false,  msg: "Something went wrong"});
		}
	}

	// Login controller

	async login({ request , auth, response}){
		const { email, password } = request.all();
		const isUserExist = await User.findBy('email',email);
		
		try {
			if(isUserExist){
				const isPasswordSame = await Hash.verify(password, isUserExist.password);
				if(isPasswordSame){
					if(isUserExist.verified){
						const token = await auth.authenticator('jwt').attempt(email, password);
						return { success: true, token };
					}else{ 
						return response.status(401).json({ success: false, notVerified: true, msg: 'User is not Verified' })
					}
					
				}else{ 
					return response.status(401).json({ success: false, msg: "Password is wrong" });
				}
			}else{ 
				return response.status(404).json({ success: false, msg: "User doesn't exist" });
			}
		} catch (error) {
			console.error(error);
			return response.status(500).json({ success: false, msg: "Something went wrong"});
		}
	}

	// Account verfication controller
	async verify({ request, response }) {
		const { email, otp } = request.all();
		let isUserExist = await User.findBy('email',email);
		try {
			if(isUserExist){
				if(isUserExist.verificationOTP == otp ){
					isUserExist.verificationOTP = null;
					isUserExist.verified = true;
					isUserExist.save(); 
					return { success: true}
				}else{
					return response.status(401).json({ success: false, msg: 'wrong Otp'});
				}
			}else{ 
				return response.status(401).json({ success: false, msg: "User doesnot exists"});
			}
		} catch (error) {
			console.log(error)
			return response.status(500).json({ success: false, msg: 'Something went wrong'});
		}
	}

	// Forget password otp and link generation controller
	async forgetPasswordOtp({ request, response }){
		const { email } = request.all();
		try{
			const user = await User.findBy('email',email);
			if(user){
			const OTP = Math.floor(Math.random() * 9999);
			user.forgetPasswordOtp = OTP;
			await user.save();
			const link = `/localhost:3000/forget_password?email=${user.email}`
				await Mail.connection('ethereal').send('emails.forgetPassword', { ...user.toJSON(), link, OTP}, (message)=>{
					message.to(user.email).from(Env.get('MAIL_USERNAME'))
				})
			return { success: true}
			}else{
				return response.status(401).json({ success: false, msg: "User does not exist"})
			}

		}catch(error){
			console.log(error);
			return response.status(500).json({ success: false, msg: 'Something went wrong'});
		}
	}

	// Otp verification for forgetPassword Controller
	async verifyForgetPasswordOtp({ request, response }){
		const { email, otp } = request.all();
		try {
			const user = await User.findBy('email',email);
			if(user){
				if(user.forgetPasswordOtp == otp){
					user.forgetPasswordOtp = null;
					await user.save();
					return { success: true }
				}else{
					return response.status(401).json({ success: false, msg: "Please enter right otp"});
				}
			}else{
				return response.status(401).json({ success: false, msg: "User doesn't exist"});
			}
		} catch (error) {
			console.error(error);
			return response.status(500).json({ success:false, msg: 'Something went wrong'});
		}
	}

	// Reset forget password controller
	async forgetPasswordReset({ request, response }){
		const { email , newPasssword } = request.all();
		try {
			let user = await User.findBy('email',email);
			if(user){
				if(!user.forgetPasswordOtp){
					user.password = newPasssword;
					user.save();
					return { success: true}
				}else { 
					return response.status(401).json({ success: false, msg: "Please verify otp"})
				}
			}else{
				return response.status(401).json({ success: false, msg: "User doesn't exist"});
			}

		} catch (error) {
			console.error(error);
			return response.status(500).json({ success: false});
		}
	}

	// Reset Password controller
	async resetPassword({ request, auth, response }){
		const { oldPassword , newPassword } = request.all();
		const id = auth.user.id;
		try {
			const user = await User.find(id);
			const isSame = await Hash.verify(oldPassword, user.password);
			if(user){
				if(isSame){
					user.password = newPassword;
					user.save();
					return { success: true };
				}else { 
					return response.status(401).json({ success: false, msg: "Old password is not same"});
				}
			}else{
				return response.status(401).json({ success: false, msg: "User doesn't exist"});
			 }
		} catch (error) {
			console.error(error);
			return response.status(500).json({ success: false, msg: "Something went wrong"});
		}
	}
}

module.exports = UserController;
