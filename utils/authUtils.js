const passport = require("passport");

//passport middlewar
const user_auth = passport.authenticate("jwt", { session: false });



const serializeUser = (user) => {
  const imageUrl = user.image
    ? `${req.protocol}://${req.get("host")}/public/userImages/${user.image}`
    : null;
    console.log(user.dynamoCoin,"kakkakakka")
  return {
    _id: user._id,
    role: user.role,
    email: user.email,
    name: user.name,
    mobile: user.mobile,
    image: imageUrl,
    countryIcon: user.countryIcon,
    country:user.country,
   dynamoCoin:user.dynamoCoin,
   Rating: user.rating
  };
};

/**
 * @DESC Check Role Middleware
 */

const checkRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(401).json({
      success: false,
      message: `You are not allowed to access this page`,
    });
  }
  next();
};

module.exports = {
  user_auth,
  serializeUser,
  checkRole,
};
