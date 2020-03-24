const passport = require('passport');
const ExtractJwt = require('passport-jwt').ExtractJwt;
const JwtStrategy = require('passport-jwt').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./user_model').model;

passport.serializeUser((user, done) => {
	done(null, user.id);
});

passport.deserializeUser((id, done) => {
	User.findById(id).then((user) => {
		done(null, user);
	});
});

passport.use(new JwtStrategy({
		jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme("jwt"),
		secretOrKey: config.get('authentication.token.secret'),
		issuer: config.get('authentication.token.issuer'),
		audience: config.get('authentication.token.audience')
	},
	(payload, done) => {
	  const user = users.getUserById(parseInt(payload.sub));
	  if (user) {
	      return done(null, user, payload);
	  }
	  return done();
	}
));

passport.use(
	new GoogleStrategy({ 		//options for the google strat
		callbackURL: '/auth/google/redirect',
		clientID: '510891134909-4nbjhngrpgjub78088povp2fcddr04db.apps.googleusercontent.com',
		clientSecret: 'gxrKIfY9tGi6q8M_s-84hmRa'
	},
	(accessToken, refreshToken, profile, done) => {
		// after authenticating:
		// check if user already exists in our db
		User.findOne({googleId: profile.id}).then((currentUser) => {
			if(currentUser){
				// already have the user
				console.log('user is: ' + currentUser);
				currentUser.googleAccessToken  = accessToken;
				currentUser.googleRefreshToken = refreshToken;

				currentUser.save().then((user) => {
					console.log('updated access token');
					done(null, currentUser);
				});
			} else {
				// if not, create user in our db
				new User({
					username: profile.displayName,
					googleId: profile.id,
					googleAccessToken: accessToken,
					googleRefreshToken: refreshToken
				}).save().then((newUser) => {
					console.log('new user created: ' + newUser);
					done(null, newUser);
				});
			}
		})
	})
);
