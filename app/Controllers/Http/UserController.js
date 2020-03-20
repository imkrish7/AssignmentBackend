'use strict';
const User = use('App/Models/User');
const Mail = use('Mail');
const Env = use('Env');

class UserController {
	async create({ request }) {
		const { email, name, phonenumber, password, countrycode } = request.all();
		const isUserExist = await User.findBy('email', email);
		try {
			if (!isUserExist) {
				const user = await User.create({
					name,
					email,
					phonenumber,
					password,
					countrycode,
					verified: false,
				});

				await Mail.connection('sparkpost').send('emails.welcome', user.toJSON(), (message)=>{
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
}

module.exports = UserController;
